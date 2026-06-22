import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const configDirectory = path.dirname(fileURLToPath(import.meta.url));
const isGithubPages = process.env.GITHUB_PAGES === "true";
const githubPagesBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 94],
  },
  turbopack: {
    root: configDirectory,
  },
  // 메인 도메인(vrink.kr/erp)으로 ERP에 접속하는 경우 ERP 도메인으로 안내.
  // 정적 export(GitHub Pages) 빌드에서는 redirects를 지원하지 않으므로 빈 배열을 반환한다.
  async redirects() {
    if (isGithubPages) return [];
    return [
      {
        source: "/erp",
        destination: "https://erp.vrink.kr/erp/login",
        permanent: true,
      },
      {
        source: "/erp/:path*",
        destination: "https://erp.vrink.kr/erp/login",
        permanent: true,
      },
    ];
  },
  ...(isGithubPages
    ? {
        assetPrefix: githubPagesBasePath ? `${githubPagesBasePath}/` : undefined,
        basePath: githubPagesBasePath || undefined,
        images: {
          qualities: [75, 94],
          unoptimized: true,
        },
        output: "export" as const,
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
