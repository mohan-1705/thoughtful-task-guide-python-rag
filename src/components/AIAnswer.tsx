type Props = {
  answer: string;
};

export default function AIAnswer({ answer }: Props) {
  if (!answer) return null;

  return (
    <div className="mt-6 rounded-lg border p-5 bg-white shadow">

      <h2 className="font-bold text-lg mb-3">
        AI Recommendation
      </h2>

      <p>{answer}</p>

    </div>
  );
}
