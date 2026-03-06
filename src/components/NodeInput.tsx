import { useState, useEffect } from 'react';
import { usePowerTreeStore } from '../stores/usePowerTreeStore';

export function NodeInput({
    value,
    onUpdate,
    step,
    className
}: {
    value: number,
    onUpdate: (val: string) => void,
    step: string,
    className: string
}) {
    const [localVal, setLocalVal] = useState(value.toString());
    const theme = usePowerTreeStore(state => state.theme);

    useEffect(() => {
        setLocalVal(value.toString());
    }, [value]);

    const handleBlur = () => onUpdate(localVal);
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            onUpdate(localVal);
            (e.currentTarget as HTMLInputElement).blur();
        }
    };

    return (
        <input
            type="number"
            value={localVal}
            onChange={(e) => setLocalVal(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onPointerDown={(e) => e.stopPropagation()}
            step={step}
            className={`nopan nodrag [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none border-b border-dashed rounded-none pb-0.5 min-w-[32px] text-center transition-colors ${
                theme === 'dark' 
                    ? 'border-zinc-700 hover:border-zinc-500' 
                    : 'border-zinc-300 hover:border-zinc-400'
            } ${className}`}
        />
    );
}
