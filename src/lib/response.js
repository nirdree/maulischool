import { NextResponse } from 'next/server';

const respond = (status, success, message, data = null, meta = null) => {
  const body = { success, message };
  if (data !== null) body.data = data;
  if (meta !== null) body.meta = meta;
  return NextResponse.json(body, { status });
};

export const r = {
  ok:          (data, message = 'Success')            => respond(200, true,  message, data),
  created:     (data, message = 'Created')            => respond(201, true,  message, data),
  noContent:   ()                                     => new NextResponse(null, { status: 204 }),
  badRequest:  (message = 'Bad request')              => respond(400, false, message),
  unauthorized:(message = 'Unauthorized')             => respond(401, false, message),
  forbidden:   (message = 'Forbidden')                => respond(403, false, message),
  notFound:    (message = 'Not found')                => respond(404, false, message),
  conflict:    (message = 'Conflict')                 => respond(409, false, message),
  serverError: (message = 'Internal server error')    => respond(500, false, message),
};