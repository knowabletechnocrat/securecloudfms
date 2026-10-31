
import { useEffect, useState } from 'react';

const API =
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000/api';

async function call(path, options = {}) {
  const response = await fetch(API + path, {
    credentials: 'include',
    ...options
  });

  const data = response.headers
    .get('content-type')
    ?.includes('application/json')
    ? await response.json()
    : null;

  if (!response.ok) {
    throw new Error(data?.message || 'Request failed');
  }

  return data;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: ''
  });

  const [files, setFiles] = useState([]);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  async function refresh() {
    const data = await call('/files');
    setFiles(data.files || []);
  }

  useEffect(() => {
    call('/auth/me')
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          refresh().catch((error) =>
            setMessage(error.message)
          );
        }
      })
      .catch(() => {});
  }, []);

  async function auth(event) {
    event.preventDefault();
    setMessage('');

    try {
      const data = await call('/auth/' + mode, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      });

      setUser(data.user);

      try {
        await refresh();
      } catch (error) {
        setMessage(error.message);
        return;
      }

      setMessage(
        mode === 'register'
          ? 'Registration successful.'
          : 'Signed in successfully.'
      );
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function upload(event) {
    event.preventDefault();

    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await call('/files/upload', {
        method: 'POST',
        body: formData
      });

      setFile(null);
      event.target.reset();
      await refresh();
      setMessage('File uploaded successfully.');
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function download(selectedFile) {
    try {
      const response = await fetch(
        `${API}/files/${selectedFile.id}/download`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');

      anchor.href = url;
      anchor.download = selectedFile.filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setMessage(error.message);
    }
  }

  
async function deleteFile(selectedFile) {
  const confirmed = window.confirm(
    `Are you sure you want to delete "${selectedFile.filename}"?`
  );

  if (!confirmed) return;

  try {
    await call(`/files/${selectedFile.id}`, {
      method: 'DELETE'
    });

    await refresh();
    setMessage('File deleted successfully.');
  } catch (error) {
    setMessage(error.message);
  }
}


  async function logout() {
    try {
      await call('/auth/logout', { method: 'POST' });
      setUser(null);
      setFiles([]);
      setForm({ name: '', email: '', password: '' });
      setMessage('');
    } catch (error) {
      setMessage(error.message);
    }
  }

  if (!user) {
    return (
      <main className="center">
        <section className="card">
          <div className="logo">S</div>
          <small>SECURE CLOUD STORAGE</small>

          <h1>
            {mode === 'login'
              ? 'Welcome back'
              : 'Create account'}
          </h1>

          <p>Your files, organized and protected.</p>

          <form onSubmit={auth}>
            {mode === 'register' && (
              <input
                type="text"
                placeholder="Full name"
                required
                value={form.name}
                onChange={(event) =>
                  setForm({
                    ...form,
                    name: event.target.value
                  })
                }
              />
            )}

            <input
              type="email"
              placeholder="Email address"
              required
              value={form.email}
              onChange={(event) =>
                setForm({
                  ...form,
                  email: event.target.value
                })
              }
            />

            <input
              type="password"
              placeholder="Password (8+ characters)"
              minLength={8}
              required
              value={form.password}
              onChange={(event) =>
                setForm({
                  ...form,
                  password: event.target.value
                })
              }
            />

            <button type="submit">
              {mode === 'login' ? 'Sign in' : 'Register'}
            </button>
          </form>

          <p role="status">{message}</p>

          <button
            type="button"
            className="link"
            onClick={() => {
              setMode(
                mode === 'login' ? 'register' : 'login'
              );
              setMessage('');
            }}
          >
            {mode === 'login'
              ? 'Create an account'
              : 'Back to sign in'}
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="wrap">
      <header>
        <b>▣ SecureDrive</b>

        <span>
          {user.name} · {user.role}{' '}
          <button
            className="secondary"
            onClick={logout}
          >
            Sign out
          </button>
        </span>
      </header>

      <section className="hero">
        <small>PERSONAL WORKSPACE</small>
        <h1>Your files, in one place.</h1>
        <p>Upload and manage your documents securely.</p>
      </section>

      <section className="card">
        <h2>Upload a file</h2>

        <form onSubmit={upload}>
          <input
            type="file"
            required
            onChange={(event) =>
              setFile(event.target.files?.[0] || null)
            }
          />

          <button type="submit">Upload</button>
        </form>
      </section>

      <section className="card">
        <h2>My files ({files.length})</h2>

        <button
          className="secondary"
          onClick={() =>
            refresh().catch((error) =>
              setMessage(error.message)
            )
          }
        >
          Refresh
        </button>

        {files.map((item) => (
          <article key={item.id}>
            <span>
              <b>{item.filename}</b>
              <small>
                {Math.round(
                  Number(item.size_bytes) / 1024
                )}{' '}
                KB · {item.version_count} version(s)
              </small>
            </span>

            <button onClick={() => download(item)}>
              Download
            </button>
            
<button
  className="secondary"
  type="button"
  onClick={() => deleteFile(item)}
>
  Delete
</button>

          </article>
        ))}
      </section>

      <p role="status">{message}</p>
    </main>
  );
}
