import { supabase } from '../lib/supabase';

export const addFriend = async (myUserId: string, friendCodeOrId: string) => {
  // Aquí asumo que tu "código de amigo" es el user_id de Supabase.
  // Si tienes una tabla "profiles" con códigos cortos, primero buscarías el ID de ese amigo en profiles.
  
  // Evitar agregarse a sí mismo
  if (myUserId === friendCodeOrId) {
    throw new Error('No puedes agregarte a ti mismo como amigo');
  }

  // Insertar en la tabla friends (requiere que crees esta tabla en Supabase)
  const { error } = await supabase
    .from('friends')
    .insert([
      { user_id: myUserId, friend_id: friendCodeOrId },
      // Opcional: para que la amistad sea bidireccional automáticamente
      { user_id: friendCodeOrId, friend_id: myUserId } 
    ]);

  if (error) {
    // Si da error de restricción única (ya son amigos) u otro error
    if (error.code === '23505') throw new Error('Ya tienes a este usuario como amigo');
    throw error;
  }
};

export const getFriendsAndTheirGroups = async (userId: string) => {
  // 1. Obtener los IDs de mis amigos
  const { data: friendsData, error: friendsError } = await supabase
    .from('friends')
    .select('friend_id')
    .eq('user_id', userId);

  if (friendsError) throw friendsError;
  
  if (!friendsData || friendsData.length === 0) return [];
  
  const friendIds = friendsData.map(f => f.friend_id);

  // 2. Obtener los grupos en los que están esos amigos
  // Usamos un 'in' para traer de la tabla memberships solo a los amigos
  const { data: memberships, error: membershipsError } = await supabase
    .from('memberships')
    .select(`
      user_id,
      groups (
        id,
        name,
        is_alive,
        total_minutes,
        used_minutes,
        max_members
      )
    `)
    .in('user_id', friendIds);

  if (membershipsError) throw membershipsError;

  // 3. (Opcional) Obtener información del perfil del amigo (sus nombres) si tienes tabla profiles
  // const { data: profiles } = await supabase.from('profiles').select('id, username').in('id', friendIds);

  // Agrupamos la info de forma amigable para mostrarla en pantalla
  // Resultado: [{ friendId: 'xxx', groups: [{...}, {...}] }, ...]
  const friendGroupsMap: Record<string, any[]> = {};
  
  friendIds.forEach(id => { friendGroupsMap[id] = []; });

  memberships?.forEach((m: any) => {
    // Si la relación groups vino correctamente, la añadimos al array de ese amigo
    if (m.groups && m.user_id) {
      if (!friendGroupsMap[m.user_id]) friendGroupsMap[m.user_id] = [];
      friendGroupsMap[m.user_id].push(m.groups);
    }
  });

  const finalFriendsList = Object.keys(friendGroupsMap).map(fId => ({
    friendId: fId,
    // friendName: profiles.find(p => p.id === fId)?.username || 'Amigo Anónimo',
    groups: friendGroupsMap[fId]
  }));

  return finalFriendsList;
};
