
import http from 'k6/http';
import { check, sleep } from 'k6';

// По умолчанию запускается Load-тест.
// Для выбора режима используем PROFILE=stress или PROFILE=spike.
const profile = __ENV.PROFILE || 'load';

export const options = {
  stages: profile === 'spike'
    ? [
        { duration: '10s', target: 5 },
        { duration: '5s', target: 50 },
        { duration: '30s', target: 50 },
        { duration: '5s', target: 5 },
        { duration: '30s', target: 0 },
      ]
    : profile === 'stress'
    ? [
        { duration: '30s', target: 10 },
        { duration: '30s', target: 25 },
        { duration: '1m', target: 50 },
        { duration: '30s', target: 0 },
      ]
    : [
        { duration: '30s', target: 10 },
        { duration: '3m', target: 20 },
        { duration: '30s', target: 0 },
      ],

  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.05'],
    checks: ['rate>0.95'],
  },
};

export default function () {
  // Сценарий 1: открытие тестового API.
  const getResponse = http.get(
    'https://httpbin.org/get?source=spotify-lab'
  );

  check(getResponse, {
    'GET: статус 200': (r) => r.status === 200,
    'GET: получен ответ': (r) => r.body.length > 0,
  });

  // Сценарий 2: отправка данных методом POST.
  const payload = JSON.stringify({
    source: 'spotify-lab',
    action: 'registration-simulation',
  });

  const postResponse = http.post(
    'https://httpbin.org/post',
    payload,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  check(postResponse, {
    'POST: статус 200': (r) => r.status === 200,
    'POST: данные возвращены': (r) =>
      r.json('json.source') === 'spotify-lab',
  });

  sleep(1);
}
