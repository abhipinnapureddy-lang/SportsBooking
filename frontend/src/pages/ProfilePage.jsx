import { useEffect, useRef, useState } from 'react';
import { changeMyPassword, fetchMyProfile, updateMyProfile } from '../api.js';
import { useAuth } from '../contexts/AuthContext.jsx';

function ProfilePage() {
  const { token, user } = useAuth();
  const [profile, setProfile] = useState(user);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', roll_number: '', branch: '', semester: '', department: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [photoUrl, setPhotoUrl] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const photoInput = useRef(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const result = await fetchMyProfile(token);
        if (!active) return;
        const nextProfile = result.status === 'success' ? result.data.user : user;
        setProfile(nextProfile);
        setForm({ name: nextProfile?.name || '', phone: nextProfile?.phone || '', roll_number: nextProfile?.roll_number || '', branch: nextProfile?.branch || '', semester: nextProfile?.semester || '', department: nextProfile?.department || '' });
        if (result.status !== 'success') setError(result.message || 'Unable to load profile.');
      } catch { if (active) setError('Unable to load profile right now.'); }
      finally { if (active) setLoading(false); }
    };
    if (token) load();
    return () => { active = false; };
  }, [token, user]);

  const handleProfileSave = async (event) => {
    event.preventDefault(); setError(''); setMessage('');
    const name = form.name.trim(); const phone = form.phone.trim();
    if (name.length < 2) return setError('Name must contain at least 2 characters.');
    if (phone && !/^[0-9+()\-\s]{7,20}$/.test(phone)) return setError('Enter a valid phone number.');
    if (form.semester && (!Number.isInteger(Number(form.semester)) || Number(form.semester) < 1 || Number(form.semester) > 12)) return setError('Semester must be a number between 1 and 12.');
    try {
      const payload = { name, phone, roll_number: form.roll_number.trim(), branch: form.branch.trim(), semester: form.semester ? Number(form.semester) : '', department: form.department.trim() };
      const result = await updateMyProfile(token, payload);
      if (result.status !== 'success') return setError(result.message || 'Unable to update profile.');
      setProfile((current) => ({ ...current, ...result.data })); setForm({ ...payload, semester: payload.semester || '' }); setEditing(false); setMessage('Profile updated successfully.');
    } catch { setError('Unable to update profile right now.'); }
  };

  const handlePasswordSave = async (event) => {
    event.preventDefault(); setError(''); setMessage('');
    if (!passwords.currentPassword || !passwords.newPassword) return setError('Enter your current and new password.');
    if (passwords.newPassword.length < 6) return setError('New password must be at least 6 characters.');
    if (passwords.newPassword !== passwords.confirmPassword) return setError('New passwords do not match.');
    try {
      const result = await changeMyPassword(token, { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      if (result.status !== 'success') return setError(result.message || 'Unable to update password.');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' }); setChangingPassword(false); setMessage('Password changed successfully.');
    } catch { setError('Unable to change password right now.'); }
  };

  const handlePhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('Please choose an image file.');
    if (file.size > 2 * 1024 * 1024) return setError('Profile image must be smaller than 2 MB.');
    setPhotoUrl(URL.createObjectURL(file)); setMessage('Photo preview updated. Saving profile photos will be available with the profile-photo API.'); setError('');
  };

  const initials = (profile?.name || 'Student').split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
  if (loading) return <div className="card">Loading your student profile…</div>;

  return <div className="student-profile">
    <section className="profile-hero">
      <div className="profile-photo-wrap">
        {photoUrl ? <img className="profile-photo" src={photoUrl} alt="Profile preview" /> : <span className="profile-photo profile-initials">{initials}</span>}
        <button type="button" className="photo-edit" onClick={() => photoInput.current?.click()} aria-label="Choose profile picture">Edit</button>
        <input ref={photoInput} className="visually-hidden" type="file" accept="image/*" onChange={handlePhoto} />
      </div>
      <div><p className="eyebrow">Student profile</p><h2>{profile?.name || 'Student'}</h2><p>{profile?.email || 'Campus email not available'} · {profile?.role || 'Student'}</p></div>
      <button type="button" className="button profile-edit-button" onClick={() => { setEditing((value) => !value); setError(''); setMessage(''); }}>{editing ? 'Cancel editing' : 'Edit profile'}</button>
    </section>

    {(message || error) && <div className={`alert ${message ? 'profile-success' : ''}`} role={error ? 'alert' : 'status'}>{message || error}</div>}

    <div className="profile-grid">
      <section className="card profile-details"><div className="section-heading"><h2>Personal details</h2><span className="count-badge">Account</span></div>
        {editing ? <form className="profile-form" onSubmit={handleProfileSave}>
          <label htmlFor="profile-name">Full name<input id="profile-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength="2" /></label>
          <label htmlFor="profile-phone">Phone number<input id="profile-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Add your phone number" inputMode="tel" /></label>
          <label htmlFor="profile-roll">Roll number<input id="profile-roll" value={form.roll_number} onChange={(e) => setForm({ ...form, roll_number: e.target.value })} placeholder="Enter roll number" /></label>
          <label htmlFor="profile-branch">Branch<input id="profile-branch" value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} placeholder="e.g. Computer Science" /></label>
          <label htmlFor="profile-semester">Semester<input id="profile-semester" type="number" min="1" max="12" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} placeholder="1–12" /></label>
          <label htmlFor="profile-department">Department<input id="profile-department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="Enter department" /></label>
          <label>Email address<input value={profile?.email || ''} disabled /></label>
          <button className="button" type="submit">Save changes</button>
        </form> : <dl className="profile-data"><div><dt>Full name</dt><dd>{profile?.name || 'Not added yet'}</dd></div><div><dt>Email</dt><dd>{profile?.email || 'Not added yet'}</dd></div><div><dt>Phone</dt><dd>{profile?.phone || 'Not added yet'}</dd></div><div><dt>Profile picture</dt><dd>{photoUrl ? 'Preview selected' : 'Not added yet'}</dd></div></dl>}
      </section>

      <section className="card profile-details"><div className="section-heading"><h2>Academic information</h2><span className="count-badge">Student record</span></div><dl className="profile-data"><div><dt>Roll Number</dt><dd>{profile?.roll_number || 'Not added yet'}</dd></div><div><dt>Branch</dt><dd>{profile?.branch || 'Not added yet'}</dd></div><div><dt>Semester</dt><dd>{profile?.semester || 'Not added yet'}</dd></div><div><dt>Department</dt><dd>{profile?.department || 'Not added yet'}</dd></div></dl></section>
    </div>

    <section className="card password-card"><div><p className="eyebrow">Security</p><h2>Change password</h2><p className="muted">Use a strong password you do not use elsewhere.</p></div><button type="button" className="button button-secondary" onClick={() => { setChangingPassword((value) => !value); setError(''); setMessage(''); }}>{changingPassword ? 'Cancel' : 'Change password'}</button>
      {changingPassword && <form className="password-form" onSubmit={handlePasswordSave}><label htmlFor="current-password">Current password<input id="current-password" type="password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} required autoComplete="current-password" /></label><label htmlFor="new-password">New password<input id="new-password" type="password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} required minLength="6" autoComplete="new-password" /></label><label htmlFor="confirm-password">Confirm new password<input id="confirm-password" type="password" value={passwords.confirmPassword} onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })} required minLength="6" autoComplete="new-password" /></label><button className="button" type="submit">Update password</button></form>}
    </section>
  </div>;
}

export default ProfilePage;
