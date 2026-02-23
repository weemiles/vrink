import { useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload, ChevronLeft, ChevronRight, FileText,
  CheckCircle2, AlertTriangle, X, Check, Users,
  ArrowRight, Copy, Info,
} from 'lucide-react';
import { NavigationBar } from '../components/NavigationBar';
import { useToast } from '../components/useToast';
import { useAnalytics } from '../components/useAnalytics';
import { useLanguage } from '../components/useLanguage';
import { useDocumentTitle } from '../components/useDocumentTitle';
import { useContacts, bulkAddContacts } from '../data/contactsStore';
import {
  parseCsv,
  autoMapFields,
  rowToCandidate,
  markDuplicates,
  readFileAsText,
  KEPPIN_FIELD_OPTIONS,
  type ParseResult,
  type FieldMapping,
  type ImportCandidate,
  type KeppinField,
} from '../data/csvImporter';

/* ─── 상수 ─── */
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_ROWS = 500;

const STEP_LABELS_KO = ['파일 선택', '필드 매핑', '미리보기', '완료'];
const STEP_LABELS_EN = ['Select File', 'Field Mapping', 'Preview', 'Done'];

/* ═══════════════════════════════════════════════
   메인 컴포넌트
   ═══════════════════════════════════════════════ */

export function ContactImportPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const analytics = useAnalytics();
  const { lang } = useLanguage();
  useDocumentTitle(lang === 'ko' ? '연락처 가져오기' : 'Import Contacts');
  const contacts = useContacts();
  const ko = lang === 'ko';

  /* ── 위자드 상태 ── */
  const [step, setStep] = useState(0); // 0: file, 1: mapping, 2: preview, 3: done
  const [fileName, setFileName] = useState('');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [candidates, setCandidates] = useState<ImportCandidate[]>([]);
  const [importedCount, setImportedCount] = useState(0);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const stepLabels = ko ? STEP_LABELS_KO : STEP_LABELS_EN;

  /* ═══════════════════════════════════════════════
     Step 0: 파일 선택
     ═══════════════════════════════════════════════ */

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.openToast(ko ? '파일 크기가 5MB를 초과합니다' : 'File size exceeds 5MB');
      return;
    }

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.tsv') && !file.name.endsWith('.txt')) {
      toast.openToast(ko ? 'CSV 파일만 지원합니다' : 'Only CSV files are supported');
      return;
    }

    try {
      const text = await readFileAsText(file);
      const result = parseCsv(text);

      if (result.headers.length === 0 || result.rows.length === 0) {
        toast.openToast(ko ? '유효한 데이터가 없습니다' : 'No valid data found');
        return;
      }

      if (result.totalRows > MAX_ROWS) {
        toast.openToast(ko ? `최대 ${MAX_ROWS}행까지 지원합니다` : `Maximum ${MAX_ROWS} rows supported`);
        return;
      }

      setFileName(file.name);
      setParseResult(result);

      // 자동 필드 매핑
      const autoMappings = autoMapFields(result.headers);
      setMappings(autoMappings);
      setStep(1);

      analytics.trackEvent('click', {
        screen_name: 'ContactImport',
        component_name: 'file_upload',
        action: 'file_selected',
      });
    } catch (err) {
      console.error('[import] File read error:', err);
      toast.openToast(ko ? '파일을 읽을 수 없습니다' : 'Cannot read file');
    }
  }, [ko, toast, analytics]);

  /* ═══════════════════════════════════════════════
     Step 1 → 2: 매핑 확정 후 미리보기 생성
     ═══════════════════════════════════════════════ */

  const hasNameMapping = mappings.some((m) => m.keppinField === 'name');

  const handleMappingConfirm = useCallback(() => {
    if (!parseResult || !hasNameMapping) return;

    // 행 → ImportCandidate 변환
    let newCandidates = parseResult.rows.map((row, i) =>
      rowToCandidate(row, mappings, i),
    );

    // 기존 연락처 대비 중복 검출
    const existing = contacts.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      birthday: c.birthday,
    }));
    newCandidates = markDuplicates(newCandidates, existing);
    setCandidates(newCandidates);
    setStep(2);
  }, [parseResult, mappings, hasNameMapping, contacts]);

  /* ═══════════════════════════════════════════════
     Step 2 → 3: 실제 임포트
     ═══════════════════════════════════════════════ */

  const selectedCandidates = candidates.filter((c) => c.selected && c.isValid);
  const duplicateCount = candidates.filter((c) => c.isDuplicate).length;
  const invalidCount = candidates.filter((c) => !c.isValid).length;

  const handleImport = useCallback(() => {
    if (importing || selectedCandidates.length === 0) return;
    setImporting(true);

    try {
      const items = selectedCandidates.map((c) => ({
        name: c.name,
        phone: c.phone,
        birthday: c.birthday,
        birthdayUnknown: c.birthdayUnknown,
        relationship: c.relationship,
        closeness: c.closeness,
        familyStatus: c.familyStatus,
        memo: c.memo,
        lastContact: c.lastContact,
      }));

      const count = bulkAddContacts(items);
      setImportedCount(count);
      setStep(3);

      analytics.trackEvent('click', {
        screen_name: 'ContactImport',
        component_name: 'import_button',
        action: 'import_complete',
      });
    } catch (err) {
      console.error('[import] Bulk add error:', err);
      toast.openToast(ko ? '가져오기에 실패했습니다' : 'Import failed');
    } finally {
      setImporting(false);
    }
  }, [importing, selectedCandidates, ko, toast, analytics]);

  /* ── 후보 선택 토글 ── */
  const toggleCandidate = useCallback((rowIndex: number) => {
    setCandidates((prev) =>
      prev.map((c) =>
        c.rowIndex === rowIndex ? { ...c, selected: !c.selected } : c,
      ),
    );
  }, []);

  const selectAll = useCallback(() => {
    setCandidates((prev) =>
      prev.map((c) => ({ ...c, selected: c.isValid })),
    );
  }, []);

  const deselectAll = useCallback(() => {
    setCandidates((prev) =>
      prev.map((c) => ({ ...c, selected: false })),
    );
  }, []);

  /* ═══════════════════════════════════════════════
     렌더링
     ═══════════════════════════════════════════════ */

  return (
    <div className="min-h-screen pb-20 bg-[var(--toss-bg)]">
      <NavigationBar
        title={ko ? '연락처 가져오기' : 'Import Contacts'}
        showBack
      />

      {/* 진행 인디케이터 */}
      <div style={{ padding: '0 24px 20px' }}>
        <div className="flex items-center gap-1">
          {stepLabels.map((label, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className="w-full rounded-full transition-colors"
                style={{
                  height: 3,
                  backgroundColor:
                    i <= step ? 'var(--toss-grey-900)' : 'var(--toss-grey-200)',
                }}
              />
              <span
                className="transition-colors"
                style={{
                  fontSize: 10,
                  fontWeight: i === step ? 700 : 500,
                  color: i <= step ? 'var(--toss-grey-900)' : 'var(--toss-grey-400)',
                }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="step0"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.2 }}
            style={{ padding: '0 24px' }}
          >
            <StepFileUpload
              ko={ko}
              fileRef={fileRef}
              onFileSelect={handleFileSelect}
            />
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.2 }}
            style={{ padding: '0 24px' }}
          >
            <StepFieldMapping
              ko={ko}
              fileName={fileName}
              parseResult={parseResult!}
              mappings={mappings}
              onUpdateMapping={(idx, field) => {
                setMappings((prev) =>
                  prev.map((m, i) => (i === idx ? { ...m, keppinField: field } : m)),
                );
              }}
              hasNameMapping={hasNameMapping}
              onBack={() => setStep(0)}
              onConfirm={handleMappingConfirm}
            />
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.2 }}
            style={{ padding: '0 24px' }}
          >
            <StepPreview
              ko={ko}
              candidates={candidates}
              selectedCount={selectedCandidates.length}
              duplicateCount={duplicateCount}
              invalidCount={invalidCount}
              importing={importing}
              onToggle={toggleCandidate}
              onSelectAll={selectAll}
              onDeselectAll={deselectAll}
              onBack={() => setStep(1)}
              onImport={handleImport}
            />
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            style={{ padding: '0 24px' }}
          >
            <StepComplete
              ko={ko}
              importedCount={importedCount}
              onGoToContacts={() => navigate('/app/contacts')}
              onGoHome={() => navigate('/app')}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Step 0: 파일 업로드
   ═══════════════════════════════════════════════ */

function StepFileUpload({
  ko,
  fileRef,
  onFileSelect,
}: {
  ko: boolean;
  fileRef: React.RefObject<HTMLInputElement | null>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="flex flex-col items-center">
      {/* 드롭 영역 */}
      <button
        onClick={() => fileRef.current?.click()}
        className="w-full flex flex-col items-center justify-center border-2 border-dashed border-toss-grey-300 rounded-2xl active:border-toss-grey-500 active:bg-toss-grey-50 transition-colors"
        style={{ padding: '48px 24px', marginBottom: 24 }}
      >
        <div
          className="flex items-center justify-center rounded-full bg-toss-grey-100 mb-4"
          style={{ width: 64, height: 64 }}
        >
          <Upload size={28} className="text-toss-grey-500" />
        </div>
        <p className="text-toss-grey-900 mb-1" style={{ fontSize: 16, fontWeight: 700 }}>
          {ko ? 'CSV 파일 선택' : 'Select CSV File'}
        </p>
        <p className="text-toss-grey-500 text-center" style={{ fontSize: 13 }}>
          {ko
            ? '최대 5MB · 500행까지 가져올 수 있어요'
            : 'Up to 5MB · 500 rows supported'}
        </p>
      </button>

      <input
        ref={fileRef}
        type="file"
        accept=".csv,.tsv,.txt"
        onChange={onFileSelect}
        className="hidden"
      />

      {/* 안내 카드 */}
      <div
        className="w-full bg-toss-grey-50 rounded-2xl"
        style={{ padding: '20px 24px' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Info size={16} className="text-toss-grey-600 shrink-0" />
          <span className="text-toss-grey-900" style={{ fontSize: 14, fontWeight: 700 }}>
            {ko ? '지원하는 형식' : 'Supported Formats'}
          </span>
        </div>
        <ul className="space-y-2 text-toss-grey-600" style={{ fontSize: 13 }}>
          <li className="flex items-start gap-2">
            <span className="shrink-0 mt-0.5">•</span>
            <span>{ko ? 'keppin에서 내보낸 CSV 파일' : 'CSV files exported from keppin'}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="shrink-0 mt-0.5">•</span>
            <span>{ko ? 'Google 연락처에서 내보낸 CSV' : 'Google Contacts CSV export'}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="shrink-0 mt-0.5">•</span>
            <span>{ko ? '첫 행은 헤더(이름, 전화번호 등)여야 합니다' : 'First row must be headers (Name, Phone, etc.)'}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="shrink-0 mt-0.5">•</span>
            <span>{ko ? 'UTF-8 인코딩 권장' : 'UTF-8 encoding recommended'}</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Step 1: 필드 매핑
   ═══════════════════════════════════════════════ */

function StepFieldMapping({
  ko,
  fileName,
  parseResult,
  mappings,
  onUpdateMapping,
  hasNameMapping,
  onBack,
  onConfirm,
}: {
  ko: boolean;
  fileName: string;
  parseResult: ParseResult;
  mappings: FieldMapping[];
  onUpdateMapping: (idx: number, field: KeppinField) => void;
  hasNameMapping: boolean;
  onBack: () => void;
  onConfirm: () => void;
}) {
  // 첫 데이터 행 미리보기
  const previewRow = parseResult.rows[0];

  return (
    <div>
      {/* 파일 정보 */}
      <div
        className="flex items-center gap-3 bg-toss-grey-50 rounded-xl mb-5"
        style={{ padding: '12px 16px' }}
      >
        <FileText size={18} className="text-toss-grey-500 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-toss-grey-900 truncate" style={{ fontSize: 13, fontWeight: 600 }}>
            {fileName}
          </p>
          <p className="text-toss-grey-500" style={{ fontSize: 11 }}>
            {ko ? `${parseResult.totalRows}행 · ${parseResult.headers.length}열` : `${parseResult.totalRows} rows · ${parseResult.headers.length} columns`}
          </p>
        </div>
      </div>

      <h3 className="text-toss-grey-900 mb-3" style={{ fontSize: 15, fontWeight: 700 }}>
        {ko ? 'CSV 열 → keppin 필드 매핑' : 'Map CSV columns to fields'}
      </h3>

      {!hasNameMapping && (
        <div
          className="flex items-center gap-2 bg-[var(--toss-red-50)] rounded-xl mb-4"
          style={{ padding: '10px 14px' }}
        >
          <AlertTriangle size={14} className="text-toss-red shrink-0" />
          <span className="text-toss-red" style={{ fontSize: 12, fontWeight: 600 }}>
            {ko ? '"이름" 필드를 반드시 매핑해주세요' : '"Name" field must be mapped'}
          </span>
        </div>
      )}

      <div className="space-y-3 mb-6">
        {mappings.map((mapping, idx) => (
          <div
            key={mapping.csvHeader}
            className="bg-[var(--toss-card-bg)] border border-toss-grey-100 rounded-xl"
            style={{ padding: '14px 16px' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-toss-grey-600 truncate" style={{ fontSize: 12, fontWeight: 600, maxWidth: '50%' }}>
                {mapping.csvHeader}
              </span>
              {mapping.confidence > 0 && (
                <span
                  className="shrink-0 rounded-full bg-toss-grey-100 text-toss-grey-500"
                  style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px' }}
                >
                  {ko ? '자동 감지' : 'Auto'}
                </span>
              )}
            </div>
            {/* 미리보기 값 */}
            {previewRow && previewRow[mapping.csvHeader] && (
              <p className="text-toss-grey-400 truncate mb-2" style={{ fontSize: 11 }}>
                {ko ? '예시: ' : 'e.g. '}{previewRow[mapping.csvHeader]}
              </p>
            )}
            {/* 드롭다운 */}
            <select
              value={mapping.keppinField}
              onChange={(e) => onUpdateMapping(idx, e.target.value as KeppinField)}
              className="w-full bg-toss-grey-50 border border-toss-grey-200 rounded-lg text-toss-grey-900 outline-none"
              style={{ fontSize: 13, fontWeight: 500, padding: '8px 12px', appearance: 'auto' }}
            >
              {KEPPIN_FIELD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {ko ? opt.labelKo : opt.labelEn}
                  {mapping.keppinField === opt.value && opt.value !== 'skip' ? ' ✓' : ''}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* 하단 버튼 */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 flex items-center justify-center gap-1 bg-toss-grey-100 text-toss-grey-700 rounded-xl active:bg-toss-grey-200 transition-colors"
          style={{ height: 48, fontSize: 14, fontWeight: 600 }}
        >
          <ChevronLeft size={16} />
          {ko ? '이전' : 'Back'}
        </button>
        <button
          onClick={onConfirm}
          disabled={!hasNameMapping}
          className="flex-[2] flex items-center justify-center gap-1 bg-toss-grey-900 text-white rounded-xl active:bg-toss-grey-700 disabled:opacity-40 transition-colors"
          style={{ height: 48, fontSize: 14, fontWeight: 600 }}
        >
          {ko ? '미리보기' : 'Preview'}
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Step 2: 미리보기 + 임포트
   ═══════════════════════════════════════════════ */

function StepPreview({
  ko,
  candidates,
  selectedCount,
  duplicateCount,
  invalidCount,
  importing,
  onToggle,
  onSelectAll,
  onDeselectAll,
  onBack,
  onImport,
}: {
  ko: boolean;
  candidates: ImportCandidate[];
  selectedCount: number;
  duplicateCount: number;
  invalidCount: number;
  importing: boolean;
  onToggle: (rowIndex: number) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBack: () => void;
  onImport: () => void;
}) {
  return (
    <div>
      {/* 요약 통계 */}
      <div
        className="grid grid-cols-3 gap-3 mb-5"
      >
        <StatBox
          label={ko ? '총 행' : 'Total'}
          value={candidates.length}
          color="var(--toss-grey-900)"
        />
        <StatBox
          label={ko ? '중복' : 'Duplicates'}
          value={duplicateCount}
          color="var(--toss-grey-500)"
        />
        <StatBox
          label={ko ? '오류' : 'Errors'}
          value={invalidCount}
          color={invalidCount > 0 ? 'var(--toss-red)' : 'var(--toss-grey-500)'}
        />
      </div>

      {/* 선택 제어 */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-toss-grey-900" style={{ fontSize: 14, fontWeight: 700 }}>
          {ko ? `${selectedCount}명 선택됨` : `${selectedCount} selected`}
        </span>
        <div className="flex gap-2">
          <button
            onClick={onSelectAll}
            className="text-toss-grey-600 active:text-toss-grey-900"
            style={{ fontSize: 12, fontWeight: 600, minHeight: 32, padding: '0 8px' }}
          >
            {ko ? '전체 선택' : 'Select All'}
          </button>
          <button
            onClick={onDeselectAll}
            className="text-toss-grey-600 active:text-toss-grey-900"
            style={{ fontSize: 12, fontWeight: 600, minHeight: 32, padding: '0 8px' }}
          >
            {ko ? '전체 해제' : 'Deselect All'}
          </button>
        </div>
      </div>

      {/* 후보 목록 */}
      <div
        className="space-y-2 mb-6"
        style={{ maxHeight: '40vh', overflowY: 'auto' }}
      >
        {candidates.map((c) => (
          <CandidateRow
            key={c.rowIndex}
            candidate={c}
            ko={ko}
            onToggle={() => onToggle(c.rowIndex)}
          />
        ))}
      </div>

      {/* 하단 버튼 */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 flex items-center justify-center gap-1 bg-toss-grey-100 text-toss-grey-700 rounded-xl active:bg-toss-grey-200 transition-colors"
          style={{ height: 48, fontSize: 14, fontWeight: 600 }}
        >
          <ChevronLeft size={16} />
          {ko ? '이전' : 'Back'}
        </button>
        <button
          onClick={onImport}
          disabled={selectedCount === 0 || importing}
          className="flex-[2] flex items-center justify-center gap-2 bg-toss-grey-900 text-white rounded-xl active:bg-toss-grey-700 disabled:opacity-40 transition-colors"
          style={{ height: 48, fontSize: 14, fontWeight: 600 }}
        >
          {importing ? (
            <span className="animate-spin">⏳</span>
          ) : (
            <Users size={16} />
          )}
          {ko ? `${selectedCount}명 가져오기` : `Import ${selectedCount}`}
        </button>
      </div>
    </div>
  );
}

/* 통계 박스 */
function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="bg-[var(--toss-card-bg)] border border-toss-grey-100 rounded-xl text-center"
      style={{ padding: '14px 8px' }}
    >
      <p style={{ fontSize: 20, fontWeight: 800, color }}>{value}</p>
      <p className="text-toss-grey-500 mt-0.5" style={{ fontSize: 11, fontWeight: 500 }}>{label}</p>
    </div>
  );
}

/* 후보 행 */
function CandidateRow({
  candidate: c,
  ko,
  onToggle,
}: {
  candidate: ImportCandidate;
  ko: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={!c.isValid}
      className={`w-full flex items-center gap-3 rounded-xl text-left transition-colors ${
        !c.isValid
          ? 'opacity-50 cursor-not-allowed'
          : c.selected
            ? 'bg-toss-grey-900/5'
            : 'bg-[var(--toss-card-bg)] active:bg-toss-grey-50'
      }`}
      style={{
        padding: '12px 14px',
        border: `1px solid ${c.selected ? 'var(--toss-grey-400)' : 'var(--toss-grey-100)'}`,
      }}
    >
      {/* 체크 원 */}
      <div
        className="shrink-0 flex items-center justify-center rounded-full transition-colors"
        style={{
          width: 24,
          height: 24,
          backgroundColor: c.selected ? 'var(--toss-grey-900)' : 'var(--toss-grey-200)',
        }}
      >
        {c.selected && <Check size={14} className="text-white" />}
      </div>

      {/* 내용 */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-toss-grey-900 truncate" style={{ fontSize: 14, fontWeight: 600 }}>
            {c.name || (ko ? '(이름 없음)' : '(No name)')}
          </span>
          {c.isDuplicate && (
            <span
              className="shrink-0 rounded-full bg-toss-grey-200 text-toss-grey-600"
              style={{ fontSize: 10, fontWeight: 600, padding: '1px 7px' }}
            >
              {ko ? '중복' : 'Dup'}
            </span>
          )}
          {!c.isValid && (
            <span
              className="shrink-0 rounded-full bg-[var(--toss-red-50)] text-toss-red"
              style={{ fontSize: 10, fontWeight: 600, padding: '1px 7px' }}
            >
              {ko ? '오류' : 'Error'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-toss-grey-500" style={{ fontSize: 11 }}>
          <span>{c.relationship}</span>
          {c.phone && <span>· {c.phone}</span>}
          {c.birthday && <span>· {c.birthday}</span>}
        </div>
        {c.isDuplicate && c.duplicateContactName && (
          <p className="text-toss-grey-400 mt-0.5" style={{ fontSize: 10 }}>
            {ko
              ? `기존 연락처 "${c.duplicateContactName}"와 중복 의심`
              : `Possible duplicate of "${c.duplicateContactName}"`}
          </p>
        )}
        {!c.isValid && c.validationErrors.length > 0 && (
          <p className="text-toss-red mt-0.5" style={{ fontSize: 10 }}>
            {c.validationErrors.join(', ')}
          </p>
        )}
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════
   Step 3: 완료
   ═══════════════════════════════════════════════ */

function StepComplete({
  ko,
  importedCount,
  onGoToContacts,
  onGoHome,
}: {
  ko: boolean;
  importedCount: number;
  onGoToContacts: () => void;
  onGoHome: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center" style={{ paddingTop: 40 }}>
      {/* 성공 아이콘 */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 15, stiffness: 300, delay: 0.1 }}
        className="flex items-center justify-center rounded-full bg-toss-grey-900 mb-6"
        style={{ width: 72, height: 72 }}
      >
        <CheckCircle2 size={36} className="text-white" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-toss-grey-900 mb-2"
        style={{ fontSize: 22, fontWeight: 800 }}
      >
        {ko ? '가져오기 완료!' : 'Import Complete!'}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-toss-grey-500 mb-10"
        style={{ fontSize: 15 }}
      >
        {ko
          ? `${importedCount}명의 연락처가 추가되었어요`
          : `${importedCount} contacts have been added`}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full space-y-3"
      >
        <button
          onClick={onGoToContacts}
          className="w-full flex items-center justify-center gap-2 bg-toss-grey-900 text-white rounded-xl active:bg-toss-grey-700 transition-colors"
          style={{ height: 48, fontSize: 14, fontWeight: 600 }}
        >
          <Users size={16} />
          {ko ? '인연 목록 보기' : 'View Contacts'}
        </button>
        <button
          onClick={onGoHome}
          className="w-full flex items-center justify-center gap-2 bg-toss-grey-100 text-toss-grey-700 rounded-xl active:bg-toss-grey-200 transition-colors"
          style={{ height: 48, fontSize: 14, fontWeight: 600 }}
        >
          {ko ? '홈으로' : 'Go Home'}
        </button>
      </motion.div>
    </div>
  );
}
