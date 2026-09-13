'use client';

import { usePathname } from 'next/navigation';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isUnauthorized = pathname.includes('unauthorized');
    const isLogin = pathname === '/login';

    return (
        <div className="relative flex min-h-screen flex-col">
            {!isUnauthorized && (
                <div className="absolute top-6 left-6">
                    <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: "#036c5f" }}
                    >
                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                            <rect x="2" y="2" width="7" height="7" rx="2" fill="white" />
                            <rect x="11" y="2" width="7" height="7" rx="2" fill="white" fillOpacity="0.6" />
                            <rect x="2" y="11" width="7" height="7" rx="2" fill="white" fillOpacity="0.6" />
                            <rect x="11" y="11" width="7" height="7" rx="2" fill="white" />
                        </svg>
                    </div>
                </div>
            )}
            <div className={isLogin ? "flex flex-1 items-center justify-center" : "flex flex-1 items-center justify-center p-4"}>
                <div className="w-full">{children}</div>
            </div>
        </div>
    );
}