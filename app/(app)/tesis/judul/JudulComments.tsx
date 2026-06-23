import { formatDateTime } from "@/lib/utils";
import { ROLE_LABEL } from "@/lib/rbac";
import { judulStageLabel, type JudulComment } from "@/lib/judul";

// Thread of comments / revision notes on a judul. Each item shows the account
// name of the commenter (and their role) plus when it was written.
export function JudulComments({ comments }: { comments: JudulComment[] }) {
  if (comments.length === 0) {
    return (
      <p className="text-sm text-slate-500">Belum ada komentar atau catatan.</p>
    );
  }

  return (
    <ul className="space-y-3">
      {comments.map((c) => (
        <li
          key={c.id}
          className="rounded-md border border-slate-200 p-3 text-sm"
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-900">{c.authorName}</span>
              {c.authorRole && (
                <span className="badge-gray">{ROLE_LABEL[c.authorRole]}</span>
              )}
            </div>
            <span className="text-xs text-slate-400">
              {formatDateTime(c.createdAt)}
            </span>
          </div>
          <p className="text-xs text-brand-700 mt-0.5">
            {judulStageLabel(c.stage, c.authorRole)}
          </p>
          <p className="text-slate-700 mt-1 whitespace-pre-wrap">{c.note}</p>
        </li>
      ))}
    </ul>
  );
}
