import React from 'react';

interface MobileLayoutProps {
    children: React.ReactNode;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen w-full bg-slate-100 flex justify-center">
            <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl relative overflow-hidden flex flex-col">
                {children}
            </div>
        </div>
    );
};

export default MobileLayout;
