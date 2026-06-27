import { FieldError } from '@heroui/react';

type InputErrorProps = {
    message?: string;
};

export default function InputError({ message }: InputErrorProps) {
    if (!message) {
        return null;
    }

    return <FieldError>{message}</FieldError>;
}
