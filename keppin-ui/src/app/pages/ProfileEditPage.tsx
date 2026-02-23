import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Camera, X, Loader2 } from 'lucide-react';
import { NavigationBar } from '../components/NavigationBar';
import { TextField } from '../components/TextField';
import { TossButton } from '../components/TossButton';
import { FixedBottomCTA } from '../components/FixedBottomCTA';
import { Popup } from '../components/Popup';
import { useToast } from '../components/useToast';
import { useAnalytics } from '../components/useAnalytics';
import { useMotionConfig, MOTION_DISTANCE } from '../components/useMotionConfig';
import { INPUT_MAX_LENGTH } from '../components/useInputValidation';
import { useAuth } from '../data/authStore';
import {
  useProfile,
  setProfile as setStoreProfile,
  syncProfileToServer,
  uploadAvatar,
  deleteAvatar,
  refreshFromServer,
  type Profile,
} from '../data/profileStore';

export function ProfileEditPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const analytics = useAnalytics();
  const motionConfig = useMotionConfig();
  const { user } = useAuth();

  useEffect(() => {
    analytics.trackScreenView('ProfileEdit');
  }, []);

  // profileStore에서 현재 프로필 가져오기
  const storeProfile = useProfile();

  // 로컬 편집용 상태 (스토어와 별개로 관리 → 저장 시에만 동기화)
  const getInitial = useCallback((): Profile => ({
    ...storeProfile,
    name: user?.user_metadata?.name || storeProfile.name,
    email: user?.email || storeProfile.email,
  }), [storeProfile, user]);

  const [profile, setProfile] = useState<Profile>(getInitial);
  const [initial, setInitial] = useState<Profile>(getInitial);
  const [dirtyDialogOpen, setDirtyDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 서버에서 프로필 새로고침 (signed URL 갱신)
  useEffect(() => {
    refreshFromServer(true).then(() => {
      // 스토어가 갱신된 후 로컬 상태도 동기화
    });
  }, []);

  // storeProfile이 서버 fetch 완료로 바뀌면 로컬도 갱신 (단, 편집 중이 아닐 때)
  useEffect(() => {
    if (!uploading) {
      setProfile((prev) => ({
        ...prev,
        profileImage: storeProfile.profileImage,
        name: user?.user_metadata?.name || storeProfile.name,
        email: user?.email || storeProfile.email,
        statusMessage: storeProfile.statusMessage || prev.statusMessage,
      }));
      setInitial((prev) => ({
        ...prev,
        profileImage: storeProfile.profileImage,
        name: user?.user_metadata?.name || storeProfile.name,
        email: user?.email || storeProfile.email,
        statusMessage: storeProfile.statusMessage || prev.statusMessage,
      }));
    }
  }, [storeProfile.profileImage]);

  const isDirty =
    profile.name !== initial.name ||
    profile.email !== initial.email ||
    profile.statusMessage !== initial.statusMessage ||
    profile.profileImage !== initial.profileImage;

  const setField = useCallback(<K extends keyof Profile>(key: K, value: Profile[K]) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = () => {
    if (!profile.name.trim()) {
      toast.openToast('이름을 입력해주세요');
      return;
    }
    // 스토어 + 서버 동기화
    setStoreProfile(profile);
    syncProfileToServer();
    toast.openToast('프로필을 저장했어요');
    setTimeout(() => navigate(-1), 300);
  };

  const handleBack = () => {
    if (isDirty) setDirtyDialogOpen(true);
    else navigate(-1);
  };

  /* 프로필 이미지 — Supabase Storage 업로드 */
  const handleImageSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setUploading(true);
      const result = await uploadAvatar(file);
      setUploading(false);

      if (result.success) {
        toast.openToast('프로필 사진을 업로드했어요');
        analytics.trackEvent('success', {
          screen_name: 'ProfileEdit',
          component_name: 'avatarUpload',
          action: 'avatar_uploaded',
        });
      } else {
        toast.openToast(result.error || '이미지 업로드에 실패했어요');
      }
    };
    input.click();
  };

  /* 프로필 이미지 삭제 */
  const handleImageDelete = async () => {
    setUploading(true);
    const result = await deleteAvatar();
    setUploading(false);

    if (result.success) {
      toast.openToast('프로필 사진을 삭제했어요');
    } else {
      toast.openToast(result.error || '이미지 삭제에 실패했어요');
    }
  };

  return (
    <div className="min-h-dvh bg-[var(--toss-bg)]">
      <NavigationBar
        title="프로필 수정"
        showBack
        onBack={handleBack}
        dirtyWarn={isDirty}
        onDirtyBack={() => setDirtyDialogOpen(true)}
      />

      <div className="pb-28" style={{ paddingTop: 16 }}>
        {/* Profile Image */}
        <motion.div
          initial={motionConfig.safeAnimate({ opacity: 0, y: MOTION_DISTANCE.overlay })}
          animate={motionConfig.safeAnimate({ opacity: 1, y: 0 })}
          transition={motionConfig.safeTransition('screen')}
          className="flex flex-col items-center pb-6"
        >
          <button
            onClick={handleImageSelect}
            disabled={uploading}
            className="relative flex items-center justify-center"
            style={{ width: 96, height: 96 }}
            aria-label="프로필 사진 변경"
          >
            <div className="rounded-full overflow-hidden" style={{ width: 88, height: 88 }}>
              {uploading ? (
                <div className="w-full h-full flex items-center justify-center bg-toss-grey-200">
                  <Loader2 size={24} className="animate-spin text-toss-grey-500" />
                </div>
              ) : storeProfile.profileImage ? (
                <img src={storeProfile.profileImage} alt="프로필" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-toss-grey-700">
                  <span className="text-[var(--primary-foreground)]" style={{ fontSize: 32, fontWeight: 700 }}>
                    {profile.name.charAt(0) || 'U'}
                  </span>
                </div>
              )}
            </div>
            <div
              className="absolute flex items-center justify-center bg-toss-grey-700 rounded-full border-2 border-[var(--toss-bg)]"
              style={{ width: 28, height: 28, bottom: 2, right: 2 }}
              aria-hidden="true"
            >
              <Camera size={14} className="text-[var(--primary-foreground)]" />
            </div>
          </button>
          {storeProfile.profileImage && !uploading && (
            <button
              onClick={handleImageDelete}
              className="mt-2 text-toss-grey-500"
              style={{ fontSize: 12, minHeight: 32 }}
            >
              사진 삭제
            </button>
          )}
          {uploading && (
            <p className="mt-2 text-toss-grey-400" style={{ fontSize: 12 }}>
              업로드 중...
            </p>
          )}
        </motion.div>

        {/* Form */}
        <motion.div
          initial={motionConfig.safeAnimate({ opacity: 0, y: MOTION_DISTANCE.overlay })}
          animate={motionConfig.safeAnimate({ opacity: 1, y: 0 })}
          transition={{ ...motionConfig.safeTransition('screen'), delay: 0.05 }}
          style={{ padding: '0 24px' }}
        >
          <div style={{ marginBottom: 16 }}>
            <TextField
              variant="box"
              label="이름"
              labelOption="sustain"
              placeholder="이름을 입력해주세요"
              value={profile.name}
              onChange={(e) => setField('name', e.target.value)}
              maxLength={INPUT_MAX_LENGTH.name}
              right={
                profile.name ? (
                  <button
                    onClick={() => setField('name', '')}
                    className="flex items-center justify-center"
                    style={{ width: 28, height: 28 }}
                    aria-label="이름 지우기"
                  >
                    <X size={16} className="text-toss-grey-400" />
                  </button>
                ) : undefined
              }
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <TextField
              variant="box"
              label="이메일"
              labelOption="sustain"
              placeholder="이메일을 입력해주세요"
              value={profile.email}
              onChange={(e) => setField('email', e.target.value)}
              type="email"
              autoComplete="email"
              right={
                profile.email ? (
                  <button
                    onClick={() => setField('email', '')}
                    className="flex items-center justify-center"
                    style={{ width: 28, height: 28 }}
                    aria-label="이메일 지우기"
                  >
                    <X size={16} className="text-toss-grey-400" />
                  </button>
                ) : undefined
              }
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <TextField
              variant="box"
              label="상태 메시지"
              labelOption="sustain"
              placeholder="상태 메시지를 입력해주세요"
              value={profile.statusMessage}
              onChange={(e) => setField('statusMessage', e.target.value)}
              maxLength={50}
              right={
                profile.statusMessage ? (
                  <button
                    onClick={() => setField('statusMessage', '')}
                    className="flex items-center justify-center"
                    style={{ width: 28, height: 28 }}
                    aria-label="상태 메시지 지우기"
                  >
                    <X size={16} className="text-toss-grey-400" />
                  </button>
                ) : undefined
              }
            />
            {profile.statusMessage && (
              <p className="text-right mt-1" style={{ fontSize: 12, color: 'var(--toss-textfield-help-color)' }}>
                {profile.statusMessage.length}/50
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Save CTA */}
      <FixedBottomCTA>
        <TossButton
          variant="fill"
          color="primary"
          size="xlarge"
          display="full"
          disabled={!profile.name.trim() || !isDirty || uploading}
          onClick={handleSave}
        >
          저장하기
        </TossButton>
      </FixedBottomCTA>

      {/* Dirty Dialog */}
      <Popup
        isOpen={dirtyDialogOpen}
        onClose={() => setDirtyDialogOpen(false)}
        title="수정을 중단할까요?"
        description="변경한 내용이 저장되지 않아요."
        confirmText="나가기"
        cancelText="계속 수정"
        destructive
        closeOnDimmerClick={false}
        onConfirm={() => navigate(-1)}
      />
    </div>
  );
}
