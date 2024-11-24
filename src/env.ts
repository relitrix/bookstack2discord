import dotenv from 'dotenv'
import { cleanEnv, num, str, url } from 'envalid'

dotenv.config();

export default cleanEnv(process.env, {
  PORT: num(),
  KEY: str(),
  DISCORD_WEBHOOK_URL: url(),
  BOOKSTACK_URL: url(),
  BOOKSTACK_TOKEN: str()
})