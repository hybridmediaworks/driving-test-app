type HeaderInfo = {
  headerSequence?: string;
  headerTitle?: string;
  headerDesc?: string;
  totalQuestions?: string;
};

export default function StepsHeader({ headerInfo }: { headerInfo?: HeaderInfo }) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex w-4/5 items-start gap-3">
        {headerInfo?.headerSequence && (
          <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-purple-600 text-2xl font-bold text-white">
            {headerInfo.headerSequence}
          </div>
        )}
        <div>
          <h2 className="text-3xl font-semibold">{headerInfo?.headerTitle}</h2>
          <p className="text-base text-gray-500">{headerInfo?.headerDesc}</p>
        </div>
      </div>

      {headerInfo?.totalQuestions && (
        <span className="w-1/5 text-right text-sm text-gray-400">{headerInfo.totalQuestions} questions + Marathon</span>
      )}
    </div>
  );
}
