import { redirect } from 'next/navigation'

// O perfil do próprio usuário logado fica em /conta
export default function PerfilPage() {
  redirect('/conta')
}
