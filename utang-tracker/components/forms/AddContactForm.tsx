"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  colors,
  fonts,
  spacing,
  borderRadius,
  labelStyle,
  inputStyle,
  buttonStyle,
} from "@/lib/design";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  notes: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface AddContactFormProps {
  onSubmit: (data: ContactFormData) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
  initialData?: ContactFormData;
}

export default function AddContactForm({
  onSubmit,
  isLoading = false,
  onCancel,
  initialData,
}: AddContactFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: initialData,
  });

  const onSubmitForm = async (data: ContactFormData) => {
    await onSubmit(data);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmitForm)}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: spacing.lg,
        fontFamily: fonts.dmSans,
      }}
    >
      <div>
        <label style={labelStyle}>Name</label>
        <input
          {...register("name")}
          type="text"
          placeholder="Juan Dela Cruz"
          style={
            {
              ...inputStyle,
              width: "100%",
              boxSizing: "border-box",
              backgroundColor: colors.dark,
              color: colors.light,
              fontSize: "14px",
            } as React.CSSProperties
          }
        />
        {errors.name && (
          <p
            style={{
              color: colors.danger,
              fontSize: "12px",
              marginTop: spacing.xs,
              margin: 0,
            }}
          >
            {errors.name.message}
          </p>
        )}
      </div>

      <div>
        <label style={labelStyle}>Phone (Optional)</label>
        <input
          {...register("phone")}
          type="tel"
          placeholder="09123456789"
          style={
            {
              ...inputStyle,
              width: "100%",
              boxSizing: "border-box",
              backgroundColor: colors.dark,
              color: colors.light,
              fontSize: "14px",
            } as React.CSSProperties
          }
        />
      </div>

      <div>
        <label style={labelStyle}>Email (Optional)</label>
        <input
          {...register("email")}
          type="email"
          placeholder="juan@example.com"
          style={
            {
              ...inputStyle,
              width: "100%",
              boxSizing: "border-box",
              backgroundColor: colors.dark,
              color: colors.light,
              fontSize: "14px",
            } as React.CSSProperties
          }
        />
        {errors.email && (
          <p
            style={{
              color: colors.danger,
              fontSize: "12px",
              marginTop: spacing.xs,
              margin: 0,
            }}
          >
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label style={labelStyle}>Notes (Optional)</label>
        <textarea
          {...register("notes")}
          placeholder="Any additional notes about this contact..."
          style={
            {
              ...inputStyle,
              width: "100%",
              boxSizing: "border-box",
              backgroundColor: colors.dark,
              color: colors.light,
              fontSize: "14px",
              minHeight: "80px",
              fontFamily: fonts.dmSans,
              resize: "vertical",
            } as React.CSSProperties
          }
        />
      </div>

      <div style={{ display: "flex", gap: spacing.md }}>
        <button
          type="submit"
          disabled={isLoading}
          style={
            {
              ...buttonStyle("primary"),
              flex: 1,
              opacity: isLoading ? 0.6 : 1,
              cursor: isLoading ? "not-allowed" : "pointer",
            } as React.CSSProperties
          }
        >
          {isLoading ? "Saving..." : "Save Contact"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={
              {
                ...buttonStyle("ghost"),
                flex: 1,
              } as React.CSSProperties
            }
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
