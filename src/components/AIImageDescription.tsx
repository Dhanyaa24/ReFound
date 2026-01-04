import { useEffect, useState } from 'react';
import { generateImageDescription } from '@/lib/googleAI';
import { Button } from '@/components/ui/button';

export default function AIImageDescription({ analysis, topMatch, onConfirm }: any) {
  const [desc, setDesc] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const d = await generateImageDescription(analysis, topMatch);
      if (mounted) {
        setDesc(d);
        setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [analysis, topMatch]);

  useEffect(() => {
    if (onConfirm) onConfirm(confirmed, desc);
  }, [confirmed, desc, onConfirm]);

  return (
    <div className="rounded-lg border border-border bg-secondary/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium">Image description (AI)</h4>
          <p className="text-xs text-muted-foreground">Please confirm that the description fits your item.</p>
        </div>
        <div className="flex items-center gap-2">
          {!editing ? (
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              Edit
            </Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          )}
          <Button size="sm" onClick={() => setConfirmed((c) => !c)}>
            {confirmed ? 'Confirmed' : 'Confirm'}
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Generating description…</p>
      ) : editing ? (
        <textarea className="w-full rounded-md border p-2" value={desc} onChange={(e) => setDesc(e.target.value)} />
      ) : (
        <p className="text-sm">{desc}</p>
      )}
    </div>
  );
}
