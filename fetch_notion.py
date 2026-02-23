import json
import os
import urllib.request
import urllib.parse
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

TOKEN = "ntn_b37577911664J7dUR9DubtOVkjlFNfxBY8u7hdvSoTU1fy"
HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
}

PAGES = [
    "30b0dffb-57be-810f-ba16-fddbb0fe5de4",
    "30b0dffb-57be-8180-bed0-f779cfae8e86",
    "30b0dffb-57be-8101-85f4-d6215222b536",
    "30b0dffb-57be-8173-86e3-ea0dd31bb7ca",
    "30b0dffb-57be-81e7-8324-f1e1b0504df3",
    "30b0dffb-57be-8110-b5e6-d86284d52c12",
    "30b0dffb-57be-816c-b999-e2f99bee0c59",
    "30b0dffb-57be-8151-9b91-f7167071e074",
    "30b0dffb-57be-81cc-a9a4-ffdf9d6cd95a",
    "30b0dffb-57be-813a-968c-e980243cf43d",
    "30b0dffb-57be-81f5-ad6d-fde23831f0ab",
    "30b0dffb-57be-81e0-976e-cfea85a8d7dc",
    "30b0dffb-57be-817c-b84e-c83cb26ee403",
    "30b0dffb-57be-8183-a2ee-ef052ffbd761",
    "30b0dffb-57be-8154-acd5-e70332b572e7",
    "30b0dffb-57be-8124-b5f4-fb45e8624f7a",
    "30b0dffb-57be-810a-9ff3-f031c0c7b380",
    "30b0dffb-57be-8137-9a27-c061f9bded6d",
    "30b0dffb-57be-8140-8ed5-de80a4584b7a",
    "30b0dffb-57be-8183-a5da-e7ba9ded1093",
    "30b0dffb-57be-815f-a4be-c135716af613",
    "30b0dffb-57be-815e-b58d-fe275e50e845",
    "30b0dffb-57be-8103-89d1-ffb5d0c8b3fa",
    "30b0dffb-57be-81c1-8513-f687fd30b2d9",
    "30b0dffb-57be-81ae-835a-c1c69184bc13",
    "30b0dffb-57be-8180-8e02-da2c4b8cdf19",
    "30b0dffb-57be-81cc-89cb-dcb9c36df71f",
    "30b0dffb-57be-81ab-b0a0-d94dacaf611a",
    "30b0dffb-57be-8186-8c0e-f803bef70241",
    "078a5fef-2cf2-4fd0-b78c-31bf520766bf",
    "d900d336-19a0-42ad-8986-bddd5f327fdd"
]

def make_request(url):
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, context=ctx) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return {}

def get_page_info(page_id):
    data = make_request(f"https://api.notion.com/v1/pages/{page_id}")
    props = data.get("properties", {})
    title_prop = []
    if "title" in props:
        title_prop = props["title"].get("title", [])
    elif "Name" in props:
        title_prop = props["Name"].get("title", [])
    else:
        for key, val in props.items():
            if val.get("type", "") == "title":
                title_prop = val.get("title", [])
                break
    
    if title_prop:
        return title_prop[0].get("plain_text", "Untitled")
    return "Untitled"

def get_blocks(block_id):
    blocks = []
    cursor = None
    while True:
        url = f"https://api.notion.com/v1/blocks/{block_id}/children?page_size=100"
        if cursor:
            url += f"&start_cursor={cursor}"
        data = make_request(url)
        results = data.get("results", [])
        if not results:
            break
        blocks.extend(results)
        if data.get("has_more"):
            cursor = data.get("next_cursor")
        else:
            break
    return blocks

def blocks_to_text(blocks, indent=""):
    text = ""
    for b in blocks:
        b_type = b.get("type", "")
        b_content = b.get(b_type, {})
        if "rich_text" in b_content:
            rich_text = b_content.get("rich_text", [])
        else:
            if b_type == "child_page":
                text += f"{indent}- [하위 페이지: {b_content.get('title', '')}]\n"
                continue
            else:
                rich_text = []

        line = "".join([rt.get("plain_text", "") for rt in rich_text])
        if b_type.startswith("heading"):
            depth = int(b_type[-1])
            text += f"\n{indent}{'#' * depth} {line}\n"
        elif b_type == "bulleted_list_item":
            text += f"{indent}- {line}\n"
        elif b_type == "numbered_list_item":
            text += f"{indent}1. {line}\n"
        elif b_type == "to_do":
            checked = "[x]" if b_content.get("checked") else "[ ]"
            text += f"{indent}{checked} {line}\n"
        elif b_type == "code":
            lang = b_content.get("language", "")
            text += f"\n{indent}```{lang}\n{line}\n{indent}```\n"
        elif b_type == "quote":
            text += f"{indent}> {line}\n"
        elif b_type == "callout":
            icon = b_content.get("icon", {}).get("emoji", "")
            text += f"\n{indent}> {icon} {line}\n"
        elif b_type == "divider":
            text += f"\n{indent}---\n"
        elif line:
            text += f"{indent}{line}\n"
        
        if b.get("has_children"):
            child_blocks = get_blocks(b["id"])
            text += blocks_to_text(child_blocks, indent + "    ")
            
    return text

OUTPUT_DIR = "/Users/minwoo/Documents/New project/TDS_Rules"
os.makedirs(OUTPUT_DIR, exist_ok=True)

all_combined = ""

for pid in PAGES:
    title = get_page_info(pid)
    safe_title = "".join(c for c in title if c.isalnum() or c in " _-[]()").strip().replace(" ", "_").replace("/", "_")
    print(f"Fetching: {title}")
    blocks = get_blocks(pid)
    content = blocks_to_text(blocks)
    
    with open(os.path.join(OUTPUT_DIR, f"{safe_title}.md"), "w", encoding="utf-8") as f:
        f.write(f"# {title}\n\n")
        f.write(content)
        
    all_combined += f"## {title}\n\n{content}\n\n---\n\n"
    
with open(os.path.join(OUTPUT_DIR, "combined_rules_for_ai.md"), "w", encoding="utf-8") as f:
    f.write("# TDS 통합 룰 세트 (AI 학습용)\n\n" + all_combined)

cursor_prompt = '''# TDS/제품 운영 가이드라인 프롬프트 (System Prompt for AI)

당신은 Toss Design System(TDS)과 내부 제품 운영 가드레일을 완벽히 숙지한 시니어 프론트엔드/UX 엔지니어 역할을 수행합니다.
다음의 수치화된 가이드라인과 룰 규칙을 기반으로 코드를 작성하고 리뷰하며, UI/UX 의사결정을 내려야 합니다.

## 핵심 원칙 (Core Principles)
1. 모든 UI 설계와 수치, 여백, 폰트, 컬러는 추출된 TDS(Toss Design System) 규칙을 최우선적으로 따릅니다.
2. 컴포넌트 조합 및 상태 정의 시 문서에 명시된 제약 조건을 위반하지 않습니다.
3. Accessible(A11y) 기준을 준수하여 작성해야 합니다.

## 적용 방법 안내
- 전체 문서는 `combined_rules_for_ai.md` 또는 개별 마크다운 파일들을 참조하여 RAG 나 프롬프트 Context 로 주입하세요.
- 각 규칙을 바탕으로 사용자의 요청에 대해 엄격하지만 생산적인 가이드와 코드를 제공하세요.
'''

with open(os.path.join(OUTPUT_DIR, "cursorrules_system_prompt.md"), "w", encoding="utf-8") as f:
    f.write(cursor_prompt)

print("All tasks completed successfully!")
