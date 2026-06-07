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
        uuid: "62d9c0af-1052-478f-94b7-305b2652ad87",
        variables: {} as {
            email: string;
            base_url: string;
            token: string,
        },
    },
    welcomeEmail: {
        uuid: "e88c1ec4-fe6f-41d7-84e8-ac89656e5f0b",
        variables: {} as {
            email: string;
            company_name: string;
        },
    },
} as const;
