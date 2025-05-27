/**
 * UpdateMeterReading component allows users to input and submit their current electricity meter reading.
 *
 * @component
 * @param {Object} props - Component props.
 * @param {string | number} props.currentReading - The current value of the meter reading input.
 * @param {(value: string) => void} props.setCurrentReading - Function to update the meter reading value.
 * @param {() => void} props.handleAddReading - Function to handle the submission of the meter reading.
 * @param {boolean} props.isSubmitting - Indicates if the submission is in progress.
 * @param {boolean} props.isSubmitted - Indicates if the form has been submitted.
 * @param {string} [props.label] - Optional label for the input field. Defaults to "Update Electricity Reading".
 * @param {string} [props.placeholder] - Optional placeholder for the input field. Defaults to "Enter current meter reading".
 * @param {string} [props.buttonText] - Optional text for the submit button. Defaults to "Update".
 * @param {string} [props.loadingText] - Optional text for the button while submitting. Defaults to "Updating...".
 *
 * @returns {JSX.Element} The rendered UpdateMeterReading component.
 */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type UpdateMeterReadingProps = {
    currentReading: string | number;
    setCurrentReading: (value: string) => void;
    handleAddReading: () => void;
    isSubmitting: boolean;
    isSubmitted: boolean;
    label?: string;
    placeholder?: string;
    buttonText?: string;
    loadingText?: string;
};

export const UpdateMeterReading = ({
    currentReading,
    setCurrentReading,
    handleAddReading,
    isSubmitting,
    isSubmitted,
    label = "Update Electricity Reading",
    placeholder = "Enter current meter reading",
    buttonText = "Update",
    loadingText = "Updating...",
}: UpdateMeterReadingProps) => {
    return (
        <div className="flex flex-col space-y-1.5">
            <Label htmlFor="reading">{label}</Label>
            <div className="flex gap-2">
                <Input
                    id="reading"
                    placeholder={placeholder}
                    value={currentReading}
                    onChange={(e) => setCurrentReading(e.target.value)}
                    type="number"
                    step="0.01"
                    className={
                        !currentReading && isSubmitted ? "border-red-500" : ""
                    }
                />
                <Button
                    onClick={handleAddReading}
                    disabled={isSubmitting}
                    className="hover:decoration-wavy hover:underline hover:underline-offset-4 hover:white focus:decoration-wavy focus:underline focus:underline-offset-4 focus:white"
                >
                    {isSubmitting ? loadingText : buttonText}
                </Button>
            </div>
            {/* Error message display */}
            {!currentReading && isSubmitted && (
                <p className="text-sm text-red-500">
                    Please enter a valid reading
                </p>
            )}
        </div>
    );
};
