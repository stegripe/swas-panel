interface FloatingLoaderProps {
    isLoading: boolean;
    message?: string;
}

export default function FloatingLoader({ isLoading, message = "Loading..." }: FloatingLoaderProps) {
    if (!isLoading) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <div className="bg-slate-800 border border-slate-600 rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[200px]">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="text-white text-sm font-medium">{message}</span>
            </div>
        </div>
    );
}
