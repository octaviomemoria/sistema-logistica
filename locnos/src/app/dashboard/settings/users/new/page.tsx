import { getRoles } from '../../roles/actions'
import UserForm from './UserForm'

export default async function NewUserPage() {
    const roles = await getRoles()

    return <UserForm roles={roles} />
}
