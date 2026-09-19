import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Shield, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Layout from '@/components/Layout';
import AuthService from '@/services/auth.service';
import UserService from '@/services/user.service';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = AuthService.getCurrentUser();
    const isAdmin = currentUser?.roles?.some(role => role === 'ROLE_ADMIN' || role.includes('ADMIN'));
    if (!isAdmin) {
      navigate('/dashboard', { replace: true });
      return;
    }
    loadUsers();
  }, [navigate]);

  const loadUsers = async () => {
    try {
      const response = await UserService.getAll();
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      let errorMessage = 'Error loading users';
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'API endpoint not found. Please check if the backend server is running on port 8080.';
        } else if (error.response.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (error.response.status === 403) {
          errorMessage = 'Access denied. Admin privileges required.';
        } else {
          errorMessage = error.response.data?.message || error.message || errorMessage;
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check if the backend server is running.';
      } else {
        errorMessage = error.message || errorMessage;
      }
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // For editing, we'll just update role for now
        // Full user update can be added later
        alert('User editing not implemented. Use role update instead.');
      } else {
        await UserService.create(formData);
        setShowForm(false);
        resetForm();
        loadUsers();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving user');
    }
  };

  const handleRoleUpdate = async (userId, newRole) => {
    try {
      await UserService.updateRole(userId, newRole);
      loadUsers();
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating role');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await UserService.delete(id);
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error deleting user';
      alert(errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: ''
    });
    setEditingUser(null);
  };

  const getRoleDisplay = (roles) => {
    if (!roles || roles.length === 0) return 'Employee';
    const role = roles[0];
    if (role.includes('ADMIN')) return 'Administrator';
    return 'Employee';
  };

  const getRoleValue = (roles) => {
    if (!roles || roles.length === 0) return 'ROLE_EMPLOYEE';
    const role = roles[0];
    if (role.includes('ADMIN')) return 'ROLE_ADMIN';
    return 'ROLE_EMPLOYEE';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground">Manage system users and roles</p>
          </div>
          <Button onClick={() => { setShowForm(true); resetForm(); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>

        {/* Users Table */}
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Username</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Role</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-muted-foreground">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-t border-border hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm font-medium">{user.username}</td>
                    <td className="px-4 py-3 text-sm">{user.email}</td>
                    <td className="px-4 py-3 text-sm">
                      {user.firstName || user.lastName
                        ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <select
                        value={getRoleValue(user.roles)}
                        onChange={(e) => handleRoleUpdate(user.id, e.target.value)}
                        className="px-2 py-1 border border-input rounded-md bg-background text-sm"
                      >
                        <option value="ROLE_EMPLOYEE">Employee</option>
                        <option value="ROLE_ADMIN">Administrator</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(user.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Add User Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Add User</h2>
                <Button variant="ghost" size="icon" onClick={() => { setShowForm(false); resetForm(); }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Username *</Label>
                  <Input
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    minLength={3}
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Password *</Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>First Name</Label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>
                    Cancel
                  </Button>
                  <Button type="submit">Create User</Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
