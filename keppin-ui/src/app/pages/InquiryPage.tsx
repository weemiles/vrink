import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { NavigationBar } from '../components/NavigationBar';
import { TextField, TextArea } from '../components/TextField';
import { TossButton } from '../components/TossButton';
import { FixedBottomCTA } from '../components/FixedBottomCTA';
import { BottomSheet } from '../components/BottomSheet';
import { useToast } from '../components/useToast';
import { useLanguage } from '../components/useLanguage';

/* 3D 아이콘 이미지 */
import phoneIcon3D from "../../assets/figma/ee0517f2109ad677a122e3ee999995a8e8c60c2a.png";

const INQUIRY_TYPES_KO = ['기능 건의', '버그 신고', '계정 문제', '데이터 복구', '기타'];
const INQUIRY_TYPES_EN = ['Feature Request', 'Bug Report', 'Account Issue', 'Data Recovery', 'Other'];

export function InquiryPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { lang } = useLanguage();
  const isKo = lang === 'ko';

  const inquiryTypes = isKo ? INQUIRY_TYPES_KO : INQUIRY_TYPES_EN;

  const [inquiryType, setInquiryType] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [email, setEmail] = useState('');
  const [typeSheetOpen, setTypeSheetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = !!(inquiryType && title.trim() && content.trim() && email.trim());

  const handleSubmit = useCallback(() => {
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);
    // Mock submit
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 800);
  }, [canSubmit, isSubmitting]);

  if (submitted) {
    return (
      <div className="min-h-dvh bg-[var(--toss-bg)]">
        <NavigationBar title={isKo ? '문의하기' : 'Contact Us'} showBack />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center px-6"
          style={{ paddingTop: 80 }}
        >
          <div
            className="flex items-center justify-center"
            style={{ width: 80, height: 80, marginBottom: 24 }}
          >
            <img
              src={phoneIcon3D}
              alt=""
              style={{ width: 80, height: 80, objectFit: 'contain' }}
              aria-hidden="true"
            />
          </div>
          <h2 className="text-toss-grey-900" style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            {isKo ? '문의가 접수되었어요' : 'Inquiry Submitted'}
          </h2>
          <p className="text-toss-grey-500 text-center" style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 32 }}>
            {isKo
              ? '빠른 시일 내에 입력하신 이메일로\n답변을 보내드릴게요.'
              : 'We\'ll send a response to your email\nas soon as possible.'}
          </p>
          <TossButton
            variant="fill"
            color="primary"
            size="large"
            display="full"
            onClick={() => navigate(-1)}
          >
            {isKo ? '돌아가기' : 'Go Back'}
          </TossButton>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[var(--toss-bg)]">
      <NavigationBar title={isKo ? '문의하기' : 'Contact Us'} showBack />

      <div className="pb-28" style={{ padding: '16px 24px' }}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-toss-grey-500 mb-6" style={{ fontSize: 14, lineHeight: 1.6 }}>
            {isKo
              ? '궁금한 점이나 불편한 점을 알려주세요.\n빠르게 확인하고 답변드릴게요.'
              : 'Let us know if you have any questions or issues.\nWe\'ll check and respond promptly.'}
          </p>

          {/* 문의 유형 */}
          <div style={{ marginBottom: 16 }}>
            <label
              className="block text-toss-grey-900"
              style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}
            >
              {isKo ? '문의 유형' : 'Inquiry Type'} <span className="text-toss-red">*</span>
            </label>
            <button
              onClick={() => setTypeSheetOpen(true)}
              className="w-full flex items-center justify-between bg-toss-grey-100 rounded-xl transition-colors active:bg-toss-grey-200"
              style={{ height: 52, paddingLeft: 16, paddingRight: 12, fontSize: 15 }}
              aria-haspopup="listbox"
            >
              <span className={inquiryType ? 'text-toss-grey-900' : 'text-toss-grey-400'}>
                {inquiryType || (isKo ? '선택해주세요' : 'Select type')}
              </span>
              <ChevronDown size={20} className="text-toss-grey-400" />
            </button>
          </div>

          {/* 제목 */}
          <div style={{ marginBottom: 16 }}>
            <TextField
              variant="box"
              label={isKo ? '제목' : 'Title'}
              labelOption="sustain"
              placeholder={isKo ? '문의 제목을 입력해주세요' : 'Enter inquiry title'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              aria-required="true"
            />
          </div>

          {/* 내용 */}
          <div style={{ marginBottom: 16 }}>
            <TextArea
              variant="box"
              label={isKo ? '내용' : 'Description'}
              placeholder={isKo
                ? '문의 내용을 자세히 적어주세요.\n스크린샷이 있으면 답변이 더 빨라져요.'
                : 'Please describe your issue in detail.'}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              minHeight={140}
              maxLength={2000}
            />
            {content && (
              <p className="text-right mt-1" style={{ fontSize: 12, color: 'var(--toss-textfield-help-color)' }}>
                {content.length}/2000
              </p>
            )}
          </div>

          {/* 답변받을 이메일 */}
          <div style={{ marginBottom: 16 }}>
            <TextField
              variant="box"
              label={isKo ? '답변받을 이메일' : 'Reply Email'}
              labelOption="sustain"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              inputMode="email"
              autoComplete="email"
              maxLength={100}
              aria-required="true"
            />
          </div>

          <div className="bg-toss-grey-50 rounded-xl p-4" style={{ marginTop: 8 }}>
            <p className="text-toss-grey-500" style={{ fontSize: 12, lineHeight: 1.6 }}>
              {isKo
                ? '• 평균 1~2 영업일 내에 답변을 드려요.\n• 개인정보는 문의 처리 목적으로만 사용돼요.\n• 문의 내역은 마이페이지에서 확인할 수 있어요.'
                : '• We typically respond within 1-2 business days.\n• Personal info is only used for inquiry processing.\n• You can check inquiry history in My Page.'}
            </p>
          </div>
        </motion.div>
      </div>

      <FixedBottomCTA>
        <TossButton
          variant="fill"
          color="primary"
          size="xlarge"
          display="full"
          disabled={!canSubmit}
          loading={isSubmitting}
          onClick={handleSubmit}
        >
          {isKo ? '문의하기' : 'Submit'}
        </TossButton>
      </FixedBottomCTA>

      {/* 문의 유형 바텀시트 */}
      <BottomSheet
        isOpen={typeSheetOpen}
        onClose={() => setTypeSheetOpen(false)}
        title={isKo ? '문의 유형' : 'Inquiry Type'}
        closeOnDimmerClick
      >
        <div className="space-y-1 pb-4">
          {inquiryTypes.map((type) => (
            <button
              key={type}
              onClick={() => { setInquiryType(type); setTypeSheetOpen(false); }}
              className={`w-full flex items-center justify-between py-3.5 px-2 rounded-lg transition-colors ${
                inquiryType === type
                  ? 'bg-toss-blue-50 text-toss-blue'
                  : 'text-toss-grey-800 active:bg-toss-grey-50'
              }`}
              style={{ fontSize: 15, minHeight: 44, fontWeight: inquiryType === type ? 600 : 400 }}
              role="option"
              aria-selected={inquiryType === type}
            >
              {type}
              {inquiryType === type && (
                <span className="text-toss-blue" style={{ fontSize: 14 }} aria-hidden="true">✓</span>
              )}
            </button>
          ))}
        </div>
      </BottomSheet>
    </div>
  );
}