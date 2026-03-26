import { cn } from '@/lib/utils';

interface LogoProps {
    className?: string;
    width?: number;
    height?: number;
    showText?: boolean;
}

export function Logo({ className, width = 160, height = 40, showText = false }: LogoProps) {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            <img
                src="/logo.svg"
                alt="MelodyMixx India"
                width={width}
                height={height}
                className="object-contain rounded-2xl"
            />
            {showText && (
                <span className="font-semibold text-lg tracking-tight sr-only">
                    MelodyMixx India
                </span>
            )}
        </div>
    );
}
