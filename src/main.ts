import Fastify from 'fastify'
import env from './env.js'
import axios from 'axios'
import { EmbedBuilder } from '@discordjs/builders'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'

const server = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty'
    },
  }
}).withTypeProvider<TypeBoxTypeProvider>()

const eventColors = {
  create: 0x69ff4f,
  update: 0xffec3d,
  delete: 0xf52020,
  move: 0xcd5ee6,
  sort: 0xcd5ee6
}

function getEmbedColor(eventName: string) {
  for (const [keyword, color] of Object.entries(eventColors)) {
    if (eventName.includes(keyword)) {
      return color;
    }
  }
  return 0x757575;
}

server.post('/:key',
  {
    schema: {
      body: Type.Object({
        event: Type.String(),
        text: Type.String(),
        url: Type.String(),
        related_item: Type.Any(),
        triggered_at: Type.String(),
        triggered_by: Type.Object({
          id: Type.Number(),
          name: Type.String(),
          slug: Type.String()
        })
      })
    }
  },
  async (request, reply) => {
    const { key }: any = request.params
    const { body } = request
    if (key !== env.KEY) {
      return reply.code(401).send('Key is invalid. Check KEY envvar')
    }
    const user = await axios.get(`${env.BOOKSTACK_URL}/api/users/${body.triggered_by.id}`,
      { headers: { Authorization: `Token ${env.BOOKSTACK_TOKEN}` } }).catch((e) => server.log.error(e))
    await axios.post(env.DISCORD_WEBHOOK_URL, {
      embeds: [
        new EmbedBuilder()
          .setTitle(body.text)
          .setURL(body.url)
          .setAuthor({ name: body.triggered_by.name, iconURL: user?.data?.avatar_url })
          .setColor(getEmbedColor(body.event))
          .setTimestamp(new Date(body.triggered_at))
          .toJSON()
      ]
    })
    return reply.code(200).send()
  })

try {
  await server.listen({ port: env.PORT, host: '0.0.0.0' })
} catch (err) {
  server.log.error(err)
  process.exit(1)
}