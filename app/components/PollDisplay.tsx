"use client";
import { useEffect,useState } from "react";
import { BarChart3, Clock } from "lucide-react";
import { useSnapshot } from "valtio";
import { store } from "@/app/store";
import { ThreadService } from "@/app/services/threads";
import { Poll } from "@/app/MainPage/types/forum";

interface PollDisplayProps {
  threadId: string;
  poll: Poll;
}

export default function PollDisplay({ threadId, poll: initialPoll }: PollDisplayProps) {
 const snap = useSnapshot(store);
  const userId = snap._id;

  const [poll, setPoll] = useState(initialPoll);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState("");
  const [ended, setEnded] = useState(false);

    useEffect(() => {
    if (!poll.endsAt) {
      setEnded(false);
      return;
    }
    const endsAtMs = new Date(poll.endsAt).getTime();

    const check = () => setEnded(Date.now() >= endsAtMs);
    check(); // set immediately on mount / poll change

    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, [poll.endsAt]);

  const myVote = poll.voters?.find((v) => v.user === userId);
  const hasVoted = !!myVote;
  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);
  const showResults = hasVoted || ended;


        const castVote = async (index: number) => {
        if (!userId) {
            setError("You need to be logged in to vote.");
            return;
        }
        if (voting || ended || index === myVote?.optionIndex) return;
        setVoting(true);
        setError("");

        const prevPoll = poll;
        setPoll((p) => {
            const options = p.options.map((o, i) => {
            let votes = o.votes;
            if (hasVoted && i === myVote!.optionIndex) votes = Math.max(0, votes - 1);
            if (i === index) votes += 1;
            return { ...o, votes };
            });
            const voters = hasVoted
            ? p.voters.map((v) => (v.user === userId ? { ...v, optionIndex: index } : v))
            : [...p.voters, { user: userId, optionIndex: index }]; // now narrowed to string
            return { ...p, options, voters };
        });

 

    try {
      const res = await ThreadService.votePoll(threadId, index);
      if (res?.success && res.data?.poll) {
        setPoll(res.data.poll as Poll); // reconcile with server truth
      } else if (!res?.success) {
        setPoll(prevPoll);
        setError("Couldn't cast your vote. Try again.");
      }
    } catch {
      setPoll(prevPoll);
      setError("Couldn't cast your vote. Try again.");
    } finally {
      setVoting(false);
    }
  };

  return (
    <div className="rounded-lg border border-(--border-soft) bg-(--bg-surface) p-4 mb-4">
      <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
        <BarChart3 size={13} /> Poll
      </div>

      <div className="font-semibold text-(--text-primary) mb-3">{poll.question}</div>

      <div className="flex flex-col gap-2">
        {poll.options.map((opt, i) => {
          const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
          const isMine = myVote?.optionIndex === i;

          if (showResults) {
            return (
              <button
                key={i}
                type="button"
                disabled={ended || voting}
                onClick={() => castVote(i)}
                className={`relative w-full text-left overflow-hidden rounded-lg border px-3 py-2 text-sm transition-colors ${
                  isMine ? "border-(--accent)" : "border-(--border-soft)"
                } ${ended ? "cursor-default" : "hover:border-(--accent)"}`}
              >
                <div
                  className="absolute inset-y-0 left-0 bg-(--accent-subtle)"
                  style={{ width: `${pct}%` }}
                />
                <div className="relative flex items-center justify-between gap-2">
                  <span className="text-(--text-primary) font-medium">
                    {opt.text} {isMine && <span className="text-(--accent)">· your vote</span>}
                  </span>
                  <span className="text-(--text-muted) shrink-0">{pct}% ({opt.votes})</span>
                </div>
              </button>
            );
          }

          return (
            <button
              key={i}
              type="button"
              disabled={voting}
              onClick={() => castVote(i)}
              className="w-full text-left rounded-lg border border-(--border-soft) hover:border-(--accent) px-3 py-2 text-sm font-medium text-(--text-primary) disabled:opacity-60 transition-colors"
            >
              {opt.text}
            </button>
          );
        })}
      </div>

      {error && <div className="mt-2 text-xs text-[#ff6b6b]">{error}</div>}

      <div className="mt-3 flex items-center justify-between text-xs text-(--text-muted)">
        <span>{totalVotes} {totalVotes === 1 ? "vote" : "votes"}</span>
        {poll.endsAt && (
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {ended ? "Poll ended" : `Ends ${new Date(poll.endsAt).toLocaleDateString()}`}
          </span>
        )}
      </div>
    </div>
  );
}