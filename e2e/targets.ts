export const isolatedResourceName = "g-13-staging-e2e";
export const isolatedHost = `${isolatedResourceName}.andhikiandre.workers.dev`;
export const isolatedOrigin = `https://${isolatedHost}`;
export const sharedOrigin = "https://g-13-staging.andhikiandre.workers.dev";

export function isolatedDatabaseId() {
  const id = process.env.E2E_D1_DATABASE_ID?.toLowerCase();
  if (
    !id ||
    !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(id) ||
    id === "5b5d43e1-399d-4844-b782-5ca632690089" ||
    id === "4961475b-b620-4a57-8e09-520e8c17578b"
  ) {
    throw new Error("E2E_D1_DATABASE_ID must identify the dedicated staging test database");
  }
  return id;
}
