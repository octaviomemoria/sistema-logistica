import { getUserById } from '../actions'
import { getRoles } from '../../roles/actions'
import EditUserForm from './EditUserForm'
import { notFound } from 'next/navigation'

export default async function EditUserPage({
    params
}: {
    params: { id: string }
}) {
    try {
        const [user, roles] = await Promise.all([
            getUserById(params.id),
            getRoles()
        ])

        return <EditUserForm user={user} roles={roles} />
    } catch (error) {
        notFound()
    }
}
