import { useTraining } from '../state/TrainingContext.tsx';
import { ProfileForm } from './ProfileForm.tsx';

/** The Settings counterpart to onboarding — same fields, edits in place. */
export function ProfileScreen({ onSaved }: { onSaved: () => void }) {
  const { profile, saveProfile } = useTraining();

  return (
    <ProfileForm
      initial={profile}
      submitLabel="Save changes"
      onSubmit={async (next) => {
        // Preserve the fields the form does not own.
        await saveProfile({
          ...next,
          liftDaysOverride: profile?.liftDaysOverride,
          onboardedAt: profile?.onboardedAt ?? new Date().toISOString(),
        });
        onSaved();
      }}
    />
  );
}
