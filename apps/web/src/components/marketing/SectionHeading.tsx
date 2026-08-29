import { Stack, Typography } from "@dhriti/ui";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <Stack spacing={1.5} sx={{ alignItems: "flex-start" }}>
      {eyebrow ? (
        <Typography
          variant="overline"
          sx={{
            letterSpacing: 1.6,
            textTransform: "uppercase",
            color: "#b7791f",
            fontWeight: 800,
          }}
        >
          {eyebrow}
        </Typography>
      ) : null}
      <Typography variant="h3" sx={{ fontWeight: 800, color: "text.primary" }}>
        {title}
      </Typography>
      <Typography variant="body1" sx={{ color: "text.secondary", maxWidth: 640 }}>
        {description}
      </Typography>
    </Stack>
  );
}
