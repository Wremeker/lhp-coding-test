import { AlertCircle } from 'lucide-react';
import { Alert } from '@heroui/react';
import { useMemo } from 'react';

type AlertErrorProps = {
    errors: string[];
    title?: string;
};

export default function AlertError({
    errors,
    title = 'Something went wrong.',
}: AlertErrorProps) {
    const uniqueErrors = useMemo(() => Array.from(new Set(errors)), [errors]);

    return (
        <Alert status="danger">
            <Alert.Indicator>
                <AlertCircle className="size-4" />
            </Alert.Indicator>
            <Alert.Content>
                <Alert.Title>{title}</Alert.Title>
                <Alert.Description>
                    <ul className="list-inside list-disc text-sm">
                        {uniqueErrors.map((error, index) => (
                            <li key={index}>{error}</li>
                        ))}
                    </ul>
                </Alert.Description>
            </Alert.Content>
        </Alert>
    );
}
