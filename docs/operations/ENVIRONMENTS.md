# Environments

| Environment | Web runtime                | Backend             | Production data allowed |
| ----------- | -------------------------- | ------------------- | ----------------------- |
| Local       | `127.0.0.1`                | Supabase Local      | No                      |
| Preview     | Vercel Preview             | Supabase Staging    | No                      |
| Staging     | Dedicated staging domain   | Supabase Staging    | No                      |
| Production  | Production domain          | Supabase Production | Yes                     |

## Rules

- Preview and staging never connect to Supabase Production.
- Production credentials never appear in `.env.example`, CI logs, or preview configuration.
- Environment validation runs during build and server startup.
- Feature flags default to disabled unless the environment explicitly enables them.
- Local Supabase services remain bound to the developer machine and are never publicly exposed.
