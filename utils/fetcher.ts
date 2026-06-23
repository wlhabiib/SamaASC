export async function fetcher(url: string) {
  const res = await fetch(url);

  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data');
    throw error;
  }

  return res.json();
}

export async function postFetcher(url: string, { arg }: { arg: any }) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(arg),
  });

  if (!res.ok) {
    const error = new Error('An error occurred while posting the data');
    throw error;
  }

  return res.json();
}

export async function putFetcher(url: string, { arg }: { arg: any }) {
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(arg),
  });

  if (!res.ok) {
    const error = new Error('An error occurred while updating the data');
    throw error;
  }

  return res.json();
}
