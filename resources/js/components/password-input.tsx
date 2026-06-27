import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input, InputGroup } from '@heroui/react';
import { cn } from '@/lib/utils';

type PasswordInputProps = React.ComponentPropsWithoutRef<'input'> & {
    className?: string;
};

export type PasswordInputHandle = {
    focus: () => void;
};

const PasswordInput = forwardRef<PasswordInputHandle, PasswordInputProps>(
    function PasswordInput({ className, ...props }, ref) {
        const [showPassword, setShowPassword] = useState(false);
        const inputRef = useRef<HTMLInputElement>(null);

        useImperativeHandle(ref, () => ({
            focus: () => inputRef.current?.focus(),
        }));

        return (
            <InputGroup className={cn('relative', className)}>
                <InputGroup.Input
                    ref={inputRef}
                    type={showPassword ? 'text' : 'password'}
                    {...props}
                />
                <InputGroup.Suffix>
                    <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="text-muted-foreground hover:text-foreground flex items-center px-3 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-[3px]"
                        aria-label={
                            showPassword ? 'Hide password' : 'Show password'
                        }
                        tabIndex={-1}
                    >
                        {showPassword ? (
                            <EyeOff className="size-4" />
                        ) : (
                            <Eye className="size-4" />
                        )}
                    </button>
                </InputGroup.Suffix>
            </InputGroup>
        );
    },
);

export default PasswordInput;
