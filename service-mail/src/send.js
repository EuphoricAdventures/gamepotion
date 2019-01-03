const sendgrid = require('@sendgrid/mail')
sendgrid.setApiKey(process.env.SENDGRID_API_KEY)

const func = async ctx => {
  ctx.assert(ctx.request.body.to, 400, 'missing "to"')
  ctx.assert(ctx.request.body.subject, 400, 'missing "subject"')
  ctx.assert(ctx.request.body.contentText, 400, 'missing "contentText"')
  ctx.assert(ctx.request.body.contentHtml, 400, 'missing "contentHtml"')
  const from = ctx.request.body.from || 'Game Maker Club <james@euphoricadventur.es>'
  const {
    to,
    subject,
    contentText,
    contentHtml
  } = ctx.request.body
  const message = {
    to,
    from,
    subject,
    text: contentText,
    html: contentHtml
  }
  await sendgrid.send(message)
  ctx.body = 'ok'
}

module.exports = func
