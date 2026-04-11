import { supabase } from '../lib/supabase';

export interface CreateGroupParams {
  name: string;
  bannedApps: string[];
  timePerPerson: number;
  maxMembers: number;
  isPublic: boolean;
  createdBy: string;
}

export const createGroup = async (params: CreateGroupParams) => {
  const totalMinutes = params.timePerPerson * params.maxMembers;

  // 1. Crear grupo
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({
      name: params.name,
      banned_apps: params.bannedApps,
      time_per_person: params.timePerPerson,
      total_minutes: totalMinutes,
      max_members: params.maxMembers,
      is_public: params.isPublic,
      created_by: params.createdBy,
    })
    .select()
    .single();

  if (groupError) throw groupError;

  // 2. Añadir creador como miembro
  try {
    const { error: memberError } = await supabase
      .from('memberships')
      .insert({ user_id: params.createdBy, group_id: group.id });

    if (memberError) throw memberError;
  } catch (error) {
    console.error('Error creando membresía:', error);
  }
  return group;
};

export const joinGroup = async (inviteCode: string, userId: string) => {
  // 1. Buscar el grupo por código
  const { data: group, error } = await supabase
    .from('groups')
    .select('id, is_alive, max_members')
    .eq('invite_code', inviteCode)
    .eq('is_alive', true)
    .single();

  if (error || !group) throw new Error('Código inválido o grupo muerto');

  // 2. Verificar cupo (opcional, puedes hacerlo en RLS o trigger)
  const { count } = await supabase
    .from('memberships')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', group.id);

  if (count && count >= group.max_members) throw new Error('Grupo lleno');

  // 3. Insertar membresía
  const { error: joinError } = await supabase
    .from('memberships')
    .insert({ user_id: userId, group_id: group.id });

  if (joinError) throw joinError;

  return group;
};
export const leaveGroup = async (userId: string, groupId: string) => {
  const { error } = await supabase
    .from('memberships')
    .delete()
    .eq('user_id', userId)
    .eq('group_id', groupId);

  if (error) throw error;
};
/*import { joinGroup } from '../services/groupService';

// ... dentro de tu componente
const handleJoin = async () => {
  try {
    // inviteCode vendría de un TextInput donde el usuario pega el código
    // session.user.id viene de tu sesión actual de Supabase
    await joinGroup(inviteCode, session.user.id);
    Alert.alert("¡Éxito!", "Te has unido al grupo correctamente");
    // navegar al grupo...
  } catch (error) {
    Alert.alert("Error", error.message);
  }
};
*/
/*const handleCreate = async () => {
  try {
    const group = await createGroup({
      name: groupName,
      bannedApps: selectedApps,
      timePerPerson: time,
      maxMembers: max,
      isPublic,
      createdBy: session.user.id,
    });
    // navegar...
  } catch (error) {
    // manejar error
  }
};*/
