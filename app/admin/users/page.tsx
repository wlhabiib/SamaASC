'use client';

import { useState, useEffect } from 'react';
import { useTeam } from '@/contexts/team-context';
import { useAuthUser } from '@/lib/auth-context';
import AppShell from '@/components/app-shell';
import { UserPlus, Search, MoreVertical, Lock, Trash2, ShieldAlert } from 'lucide-react';

interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: 'owner' | 'admin' | 'member';
  is_active: boolean;
  created_at: string;
}

export default function AdminUsersPage() {
  const { team } = useTeam();
  const { userRole } = useAuthUser();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Formulaire d'ajout
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');

  useEffect(() => {
    loadMembers();
  }, [team]);

  const loadMembers = async () => {
    if (!team) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/team-members?team_id=${team.id}`);
      const data = await response.json();
      setMembers(data || []);
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setAddError('');
    setAddSuccess(false);

    try {
      if (!team) return;

      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_id: team.id,
          first_name: firstName,
          last_name: lastName,
          role: role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création de l\'utilisateur');
      }

      setAddSuccess(true);
      setNewUserEmail(data.email);
      setNewUserPassword(data.password);
      setFirstName('');
      setLastName('');
      setRole('member');

      // Recharger la liste des membres
      loadMembers();

      // Masquer le formulaire après 5 secondes
      setTimeout(() => {
        setShowAddForm(false);
        setAddSuccess(false);
        setNewUserEmail('');
        setNewUserPassword('');
      }, 10000);
    } catch (error) {
      console.error('Error creating user:', error);
      setAddError((error as Error).message);
    } finally {
      setAdding(false);
    }
  };

  const filteredMembers = members.filter(member =>
    `${member.first_name} ${member.last_name} ${member.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-4 pt-4">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 pt-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h1>
            <p className="text-gray-600">Gérez les membres de votre équipe</p>
          </div>
          {userRole === 'owner' && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-green-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <UserPlus size={20} />
              Ajouter un utilisateur
            </button>
          )}
        </div>

        {/* Formulaire d'ajout */}
        {showAddForm && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">Ajouter un nouvel utilisateur</h2>
            
            {addSuccess ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <ShieldAlert size={16} className="text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-green-900">Utilisateur créé avec succès !</p>
                    <div className="mt-2 space-y-1 text-sm">
                      <p><span className="font-medium">Email :</span> {newUserEmail}</p>
                      <p><span className="font-medium">Mot de passe temporaire :</span> <code className="bg-green-100 px-2 py-1 rounded">{newUserPassword}</code></p>
                    </div>
                    <p className="text-xs text-green-700 mt-2">
                      Transmettez ces informations à l'utilisateur. Il devra changer son mot de passe lors de sa première connexion.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAddUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prénom
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Modou"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Fall"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rôle
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'admin' | 'member')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="member">Membre</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>

                <p className="text-sm text-gray-500">
                  L'email sera automatiquement généré : {firstName.toLowerCase()}.{lastName.toLowerCase()}@{team?.slug}.com
                </p>

                {addError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-600">{addError}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={adding || !firstName || !lastName}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {adding ? 'Création...' : 'Créer l\'utilisateur'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Liste des utilisateurs */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 font-semibold">
                            {member.first_name?.[0] || member.email[0]}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {member.first_name} {member.last_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{member.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        member.role === 'owner' ? 'bg-purple-100 text-purple-800' :
                        member.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {member.role === 'owner' ? 'Owner' : member.role === 'admin' ? 'Admin' : 'Membre'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        member.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {member.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {userRole === 'owner' && member.role !== 'owner' && (
                          <>
                            <button className="text-gray-400 hover:text-gray-600">
                              <Lock size={18} />
                            </button>
                            <button className="text-gray-400 hover:text-red-600">
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
