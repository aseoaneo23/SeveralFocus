import { supabase } from '../lib/supabase';

export interface CreateUserParams {
  username: string
}

export const createUser = async (params: CreateUserParams) => {
  const { data, error } = await supabase
    .from('users')
    .insert({
      username: params.username,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export const getFriends = async (user_id: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user_id);

  if (error) throw error;
  return data;
}

/*const handleCreate = async () => {
  try {
    const user = await createUser({
      name: userName,
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