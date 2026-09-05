import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { DateInput } from '@/components/ui/DateInput';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { updateBeneficiary } from '@/lib/drishti/api';
import type { Beneficiary } from '@/lib/drishti/types';
import { ApiError } from '@/lib/api';

export interface SurgeryMoveModalProps {
  beneficiary: Beneficiary | null;
  onClose: () => void;
}

export function SurgeryMoveModal({ beneficiary, onClose }: SurgeryMoveModalProps) {
  const qc = useQueryClient();
  const [hospital, setHospital] = useState('');
  const [operatedOn, setOperatedOn] = useState('');
  const [outcome, setOutcome] = useState('');
  const [followupOn, setFollowupOn] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      updateBeneficiary(beneficiary!.id, {
        stage: 'operated',
        surgery: {
          hospital: hospital.trim(),
          operatedOn,
          outcome: outcome.trim() || null,
          followupOn: followupOn || null,
        },
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['drishti', 'beneficiaries'] });
      reset();
      onClose();
    },
    onError: (e: unknown) => setFormError(e instanceof ApiError ? e.message : 'Could not record this surgery.'),
  });

  function reset() {
    setHospital('');
    setOperatedOn('');
    setOutcome('');
    setFollowupOn('');
    setErrors({});
    setFormError(null);
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!hospital.trim()) next.hospital = 'Enter the hospital name';
    if (!operatedOn) next.operatedOn = 'Pick the surgery date';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  const onSubmit = () => {
    if (!validate()) return;
    mutation.mutate();
  };

  return (
    <Modal
      open={Boolean(beneficiary)}
      onClose={() => {
        reset();
        onClose();
      }}
      title={beneficiary ? `Move ${beneficiary.name} to operated` : 'Move to operated'}
      description="Surgery details are required before a patient can move to the operated stage."
      footer={
        <Button onClick={onSubmit} loading={mutation.isPending}>
          Confirm surgery and move
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        {formError && (
          <Alert tone="error" title="Something went wrong">
            {formError}
          </Alert>
        )}
        <Field label="Hospital" required error={errors.hospital}>
          <Input value={hospital} onChange={(e) => setHospital(e.target.value)} maxLength={200} />
        </Field>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <Field label="Operated on" required error={errors.operatedOn}>
            <DateInput value={operatedOn} onChange={setOperatedOn} />
          </Field>
          <Field label="Follow-up on" hint="Optional">
            <DateInput value={followupOn} onChange={setFollowupOn} />
          </Field>
        </div>
        <Field label="Outcome" hint="Optional">
          <Textarea value={outcome} onChange={(e) => setOutcome(e.target.value)} rows={3} maxLength={1000} />
        </Field>
      </div>
    </Modal>
  );
}
