import { Connection } from "postgresql-client";

export async function getConnection() {
    if (process.env.DATABASE_URL) {
        let connection = new Connection(process.env.DATABASE_URL);
        await connection.connect();
        return connection;
    } else {
        let connection = new Connection({
            host: process.env.DATABASE_HOSTNAME,
            port: 5432,
            user: process.env.DATABASE_USERNAME,
            password: process.env.DATABASE_PASSWORD,
            database: process.env.DATABASE_DB,
            ssl: {
                host: process.env.DATABASE_HOSTNAME,
                port: 5432,
            }
        });
        await connection.connect();
        return connection;
    }
}