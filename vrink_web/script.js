// TDS 규칙 (상태, 에러 구조, UXR UIs 등 적용)

document.addEventListener("DOMContentLoaded", () => {

    // UI 상태 모델 정의 (idle / loading / success / error)
    const STATE = {
        IDLE: 'idle',
        LOADING: 'loading',
        SUCCESS: 'success',
        ERROR: 'error'
    };

    const form = document.getElementById("contact-form");
    const statusMsg = document.getElementById("form-status");
    const submitBtn = form.querySelector(".submit-btn");

    function validateField(inputElement) {
        const errorElement = document.getElementById(`${inputElement.id}-error`);
        let isValid = true;
        let errorText = "";

        // TDS 규칙: 오류 메시지는 "무엇이 안 됐는지(사실) + 지금 할 수 있는 행동(추천)" 구조
        if (!inputElement.value.trim()) {
            isValid = false;
            if (inputElement.id === 'companyName') errorText = "회사명이 비어있습니다. 도입을 원하는 회사명을 한 글자 이상 입력해주세요.";
            else if (inputElement.id === 'contactInfo') errorText = "연락처가 비어있습니다. 숫자 형태로 번호를 입력해주세요.";
            else if (inputElement.id === 'inquiryType') errorText = "문의 유형을 선택하지 않았습니다. 원하시는 상담 유형을 골라주세요.";
        } else if (inputElement.id === 'contactInfo') {
            const phoneRegex = /^[0-9-]{9,13}$/;
            if (!phoneRegex.test(inputElement.value.trim())) {
                isValid = false;
                errorText = "연락처 형식이 올바르지 않습니다. 하이픈(-)을 포함한 번호를 입력해주세요.";
            }
        }

        if (!isValid) {
            inputElement.classList.add('invalid');
            errorElement.textContent = errorText;
        } else {
            inputElement.classList.remove('invalid');
            errorElement.textContent = "";
        }

        return isValid;
    }

    // Input 이벤트에 맞춘 Validate
    const inputs = form.querySelectorAll("input, select");
    inputs.forEach(input => {
        input.addEventListener("blur", () => validateField(input));
        input.addEventListener("input", () => {
            if (input.classList.contains('invalid')) validateField(input);
        });
    });

    // Form 제출 처리
    form.addEventListener("submit", (e) => {
        e.preventDefault();

        // 전체 필드 검증
        let isFormValid = true;
        inputs.forEach(input => {
            if (!validateField(input)) isFormValid = false;
        });

        if (!isFormValid) {
            // 상단 에러 포커싱 이동 (TDS 접근성 A11y 룰 적용)
            const firstInvalid = form.querySelector(".invalid");
            if (firstInvalid) {
                firstInvalid.focus();
            }
            return;
        }

        // 상태 전환: Loading (중첩 제거 정책, 버튼 Disable)
        setFormState(STATE.LOADING);

        // API Mock: 1.5초 후 성공 처리
        setTimeout(() => {
            // 실제 네트워크 에러 발생 테스트용 조건
            // setFormState(STATE.ERROR); return;

            setFormState(STATE.SUCCESS);
            form.reset();
        }, 1500);
    });

    function setFormState(state) {
        switch (state) {
            case STATE.IDLE:
                submitBtn.textContent = "상담 신청하기";
                submitBtn.disabled = false;
                statusMsg.textContent = "";
                statusMsg.className = "form-status";
                break;
            case STATE.LOADING:
                submitBtn.textContent = "접수 중...";
                submitBtn.disabled = true;
                statusMsg.textContent = "";
                // 스크린리더 빈 상태에서 버튼 텍스트 변경으로 로딩인지 인지 (A11y 규칙)
                break;
            case STATE.SUCCESS:
                submitBtn.textContent = "상담 신청 완료";
                submitBtn.disabled = false;
                // 에러/성공 토스트 짧고 팩트 기반 메세지
                statusMsg.textContent = "접수가 완료되었습니다. 담당자가 24시간 내 연락드리겠습니다.";
                statusMsg.className = "form-status status-success";

                // 10초 후 자동 Idle (완화 정책)
                setTimeout(() => setFormState(STATE.IDLE), 10000);
                break;
            case STATE.ERROR:
                submitBtn.textContent = "다시 시도하기"; // 에러 시 다음 액션 (TDS)
                submitBtn.disabled = false;
                statusMsg.textContent = "네트워크가 원활하지 않습니다. 다시 시도해 주세요.";
                statusMsg.className = "form-status status-error";
                break;
        }
    }

    // 부드러운 스크롤 처리 네비게이션
    document.querySelectorAll('.nav-links a, .hero-btn').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
});
