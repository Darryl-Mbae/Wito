// lib/emails/templates.ts


export const EMAIL_TEMPLATES = {
    userInvitation: {
        uuid: "490d3835-6a62-4377-a171-1b9a27b2545a",
        variables: {} as {
            company_name: string;
            logo_url: string;
            email: string;
            base_url: string;
            token: string;
        },
    },
    passwordReset: {
        uuid: "another-uuid-here",
        variables: {} as {
            email: string;
            base_url: string;
        },
    },
    welcomeEmail: {
        uuid: "another-uuid-here",
        variables: {} as {
            email: string;
            company_name: string;
        },
    },
} as const;
