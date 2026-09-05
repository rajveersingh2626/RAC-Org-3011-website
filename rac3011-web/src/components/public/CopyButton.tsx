import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

interface CopyButtonProps {
  value: string;
  label?: string;
}

export function CopyButton({ value, label = 'Copy' }: CopyButtonProps) {
  const { toast } = useToast();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: 'Copied', tone: 'success' });
    } catch {
      toast({ title: 'Could not copy', tone: 'error' });
    }
  };
  return (
    <Button variant="ghost" size="sm" leading={<Copy aria-hidden className="size-3.5" />} onClick={() => void copy()}>
      {label}
    </Button>
  );
}
