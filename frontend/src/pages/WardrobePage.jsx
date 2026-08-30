import { useEffect, useMemo, useRef, useState } from 'react';
import { request } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import './WardrobePage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function resolveImageUrl(imageUrl) {
  if (!imageUrl) return null;
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  if (imageUrl.startsWith('/')) return `${API_URL}${imageUrl}`;
  return `${API_URL}/api/uploads/${imageUrl}`;
}

export default function WardrobePage() {
  const { token } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [filter, setFilter] = useState('all');

  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);

  const [editingItem, setEditingItem] = useState(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);

  const [uploadingId, setUploadingId] = useState(null);

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  function showToast(message, type) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  async function loadItems() {
    setLoading(true);
    setLoadError('');
    try {
      const data = await request('GET', '/api/wardrobe');
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setLoadError(err.message || 'Garderobe konnte nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  const categories = useMemo(() => {
    const unique = new Set(items.map((item) => item.category).filter(Boolean));
    return Array.from(unique).sort();
  }, [items]);

  const visibleItems = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((item) => item.category === filter);
  }, [items, filter]);

  async function handleCreate(event) {
    event.preventDefault();
    const name = formName.trim();
    const category = formCategory.trim();
    if (!name || !category) {
      setFormError('Bitte Name und Kategorie angeben.');
      return;
    }
    setFormError('');
    setCreating(true);
    try {
      await request('POST', '/api/wardrobe', { name, category });
      setFormName('');
      setFormCategory('');
      await loadItems();
      showToast('Kleidungsstück angelegt.', 'success');
    } catch (err) {
      setFormError(err.message || 'Anlegen fehlgeschlagen.');
    } finally {
      setCreating(false);
    }
  }

  function openEdit(item) {
    setEditingItem(item);
    setEditName(item.name);
    setEditCategory(item.category);
    setEditError('');
  }

  function closeEdit() {
    setEditingItem(null);
    setEditName('');
    setEditCategory('');
    setEditError('');
  }

  async function handleSaveEdit(event) {
    event.preventDefault();
    const name = editName.trim();
    const category = editCategory.trim();
    if (!name || !category) {
      setEditError('Bitte Name und Kategorie angeben.');
      return;
    }
    setEditError('');
    setSaving(true);
    try {
      await request('PATCH', `/api/wardrobe/${editingItem.id}`, {
        name,
        category,
      });
      closeEdit();
      await loadItems();
      showToast('Änderungen gespeichert.', 'success');
    } catch (err) {
      setEditError(err.message || 'Speichern fehlgeschlagen.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item) {
    const confirmed = window.confirm(
      `„${item.name}" wirklich löschen? Dies kann nicht rückgängig gemacht werden.`,
    );
    if (!confirmed) return;
    try {
      await request('DELETE', `/api/wardrobe/${item.id}`);
      await loadItems();
      showToast('Kleidungsstück gelöscht.', 'success');
    } catch (err) {
      showToast(err.message || 'Löschen fehlgeschlagen.', 'error');
    }
  }

  async function handleImageChange(item, event) {
    const file = event.target.files && event.target.files[0];
    event.target.value = '';
    if (!file) return;

    setUploadingId(item.id);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`${API_URL}/api/wardrobe/${item.id}/image`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          (data && data.detail) || 'Bild konnte nicht hochgeladen werden.',
        );
      }

      await loadItems();
      showToast('Bild hochgeladen.', 'success');
    } catch (err) {
      showToast(err.message || 'Bild konnte nicht hochgeladen werden.', 'error');
    } finally {
      setUploadingId(null);
    }
  }

  return (
    <section className="page wardrobe-page">
      <header className="wardrobe-header">
        <h1 className="page-heading">Garderobe</h1>
        <p className="wardrobe-subtitle">Deine Stücke, dein Stil.</p>
      </header>

      <form className="wardrobe-form" onSubmit={handleCreate} noValidate>
        <h2 className="wardrobe-form-heading">Neues Kleidungsstück</h2>
        {formError && <p className="form-error">{formError}</p>}
        <div className="form-field">
          <label className="form-label" htmlFor="wardrobe-name">
            Name
          </label>
          <input
            id="wardrobe-name"
            className="input"
            type="text"
            value={formName}
            onChange={(event) => setFormName(event.target.value)}
            placeholder="z. B. Schwarzes Abendkleid"
          />
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="wardrobe-category">
            Kategorie
          </label>
          <input
            id="wardrobe-category"
            className="input"
            type="text"
            value={formCategory}
            onChange={(event) => setFormCategory(event.target.value)}
            placeholder="z. B. Kleider"
            list="wardrobe-category-options"
          />
          <datalist id="wardrobe-category-options">
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </div>
        <button type="submit" className="btn" disabled={creating}>
          {creating ? 'Wird angelegt …' : 'Anlegen'}
        </button>
      </form>

      {categories.length > 0 && (
        <div className="filter-chips" role="group" aria-label="Nach Kategorie filtern">
          <button
            type="button"
            className={`filter-chip${filter === 'all' ? ' filter-chip-active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Alle
          </button>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={`filter-chip${filter === category ? ' filter-chip-active' : ''}`}
              onClick={() => setFilter(category)}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {loading && <p className="wardrobe-status">Garderobe wird geladen …</p>}

      {!loading && loadError && (
        <div className="empty-state">
          <p className="empty-state-text">{loadError}</p>
          <button type="button" className="btn btn-secondary" onClick={loadItems}>
            Erneut versuchen
          </button>
        </div>
      )}

      {!loading && !loadError && visibleItems.length === 0 && (
        <div className="empty-state">
          <p className="empty-state-icon" aria-hidden="true">
            👗
          </p>
          <p className="empty-state-text">
            {items.length === 0
              ? 'Deine Garderobe ist noch leer. Lege dein erstes Stück an.'
              : 'Keine Stücke in dieser Kategorie.'}
          </p>
        </div>
      )}

      {!loading && !loadError && visibleItems.length > 0 && (
        <div className="wardrobe-grid">
          {visibleItems.map((item) => {
            const imageUrl = resolveImageUrl(item.image_url);
            return (
              <article key={item.id} className="card wardrobe-card">
                <div className="wardrobe-card-image">
                  {imageUrl ? (
                    <img src={imageUrl} alt={item.name} className="image-tile-img" />
                  ) : (
                    <div className="image-tile-placeholder" aria-hidden="true">
                      <span className="image-tile-icon">👗</span>
                    </div>
                  )}
                </div>
                <div className="wardrobe-card-body">
                  <h3 className="wardrobe-card-name">{item.name}</h3>
                  <p className="wardrobe-card-category">{item.category}</p>
                </div>
                <div className="wardrobe-card-actions">
                  <label className="btn btn-secondary wardrobe-upload">
                    {uploadingId === item.id ? 'Lädt …' : 'Bild'}
                    <input
                      type="file"
                      accept="image/*"
                      className="visually-hidden"
                      disabled={uploadingId === item.id}
                      onChange={(event) => handleImageChange(item, event)}
                    />
                  </label>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => openEdit(item)}
                  >
                    Bearbeiten
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-danger"
                    onClick={() => handleDelete(item)}
                  >
                    Löschen
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {editingItem && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-dialog">
            <div className="modal-header">
              <h2 className="modal-title">Stück bearbeiten</h2>
              <button
                type="button"
                className="modal-close"
                onClick={closeEdit}
                aria-label="Schließen"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSaveEdit} noValidate>
              {editError && <p className="form-error">{editError}</p>}
              <div className="form-field">
                <label className="form-label" htmlFor="edit-name">
                  Name
                </label>
                <input
                  id="edit-name"
                  className="input"
                  type="text"
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="edit-category">
                  Kategorie
                </label>
                <input
                  id="edit-category"
                  className="input"
                  type="text"
                  value={editCategory}
                  onChange={(event) => setEditCategory(event.target.value)}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeEdit}
                >
                  Abbrechen
                </button>
                <button type="submit" className="btn" disabled={saving}>
                  {saving ? 'Speichert …' : 'Speichern'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast toast-${toast.type}`} role="status">
          {toast.message}
        </div>
      )}
    </section>
  );
}
