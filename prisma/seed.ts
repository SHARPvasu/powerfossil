import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding UV Insurance Agency database...')

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10)
    const admin = await prisma.user.upsert({
        where: { email: 'admin@uvinsurance.in' },
        update: {},
        create: {
            name: 'Admin User',
            email: 'admin@uvinsurance.in',
            password: adminPassword,
            role: 'ADMIN',
            phone: '+91 98000 00001',
        },
    })
    console.log('✅ Admin user created:', admin.email)

    // Create agent user
    const agentPassword = await bcrypt.hash('agent123', 10)
    const agent = await prisma.user.upsert({
        where: { email: 'agent@uvinsurance.in' },
        update: {},
        create: {
            name: 'Raj Sharma',
            email: 'agent@uvinsurance.in',
            password: agentPassword,
            role: 'AGENT',
            phone: '+91 98765 43210',
        },
    })
    console.log('✅ Agent user created:', agent.email)

    // Create auditor user
    const auditorPassword = await bcrypt.hash('auditor123', 10)
    await prisma.user.upsert({
        where: { email: 'auditor@uvinsurance.in' },
        update: {},
        create: {
            name: 'Anita Verma',
            email: 'auditor@uvinsurance.in',
            password: auditorPassword,
            role: 'AUDITOR',
            phone: '+91 97000 00099',
        },
    })
    console.log('✅ Auditor user created: auditor@uvinsurance.in')

    // Create sample customers
    const customer1 = await prisma.customer.upsert({
        where: { id: 'demo-customer-1' },
        update: {},
        create: {
            id: 'demo-customer-1',
            firstName: 'Vikram',
            lastName: 'Patel',
            phone: '9876543210',
            email: 'vikram@example.com',
            dob: '1985-06-15',
            gender: 'Male',
            address: '12, Andheri West',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400053',
            occupation: 'Software Engineer',
            income: '12,00,000',
            aadharNo: '1234 5678 9012',
            panNo: 'ABCDE1234F',
            kycStatus: 'VERIFIED',
            preExisting: JSON.stringify(['Diabetes']),
            agentId: agent.id,
        },
    })

    const customer2 = await prisma.customer.upsert({
        where: { id: 'demo-customer-2' },
        update: {},
        create: {
            id: 'demo-customer-2',
            firstName: 'Priya',
            lastName: 'Mehta',
            phone: '9123456789',
            email: 'priya@example.com',
            dob: '1992-03-22',
            gender: 'Female',
            address: '45, Koramangala',
            city: 'Bengaluru',
            state: 'Karnataka',
            pincode: '560034',
            occupation: 'Doctor',
            income: '20,00,000',
            aadharNo: '9876 5432 1098',
            panNo: 'XYZPQ9876G',
            kycStatus: 'VERIFIED',
            agentId: agent.id,
        },
    })

    const customer3 = await prisma.customer.upsert({
        where: { id: 'demo-customer-3' },
        update: {},
        create: {
            id: 'demo-customer-3',
            firstName: 'Arjun',
            lastName: 'Singh',
            phone: '8765432109',
            dob: '1978-11-05',
            gender: 'Male',
            city: 'Delhi',
            state: 'Delhi',
            occupation: 'Business Owner',
            income: '50,00,000',
            kycStatus: 'PENDING',
            agentId: admin.id,
        },
    })

    console.log('✅ Sample customers created')

    // Create sample policies
    const today = new Date()
    const nextYear = new Date(today); nextYear.setFullYear(nextYear.getFullYear() + 1)
    const expiringSoon = new Date(today); expiringSoon.setDate(expiringSoon.getDate() + 15)
    const lastYear = new Date(today); lastYear.setFullYear(lastYear.getFullYear() - 1)

    await prisma.policy.upsert({
        where: { policyNumber: 'SH-2024-001' },
        update: {},
        create: {
            policyNumber: 'SH-2024-001',
            type: 'HEALTH',
            company: 'Star Health',
            planName: 'Star Comprehensive Gold',
            subType: 'Family Floater',
            sumInsured: 1000000,
            premium: 18500,
            paymentMode: 'ANNUAL',
            startDate: '2024-01-15',
            endDate: nextYear.toISOString().split('T')[0],
            issueDate: '2024-01-10',
            status: 'ACTIVE',
            tags: JSON.stringify(['family', 'premium']),
            customerId: customer1.id,
            agentId: agent.id,
        },
    })

    await prisma.policy.upsert({
        where: { policyNumber: 'HD-2024-002' },
        update: {},
        create: {
            policyNumber: 'HD-2024-002',
            type: 'MOTOR',
            company: 'HDFC ERGO',
            planName: 'Comprehensive Car Insurance',
            vehicleNo: 'MH12AB1234',
            vehicleModel: 'Honda City 2022',
            vehicleYear: '2022',
            sumInsured: 800000,
            premium: 12000,
            paymentMode: 'ANNUAL',
            startDate: '2024-02-01',
            endDate: expiringSoon.toISOString().split('T')[0],
            status: 'ACTIVE',
            customerId: customer1.id,
            agentId: agent.id,
        },
    })

    await prisma.policy.upsert({
        where: { policyNumber: 'LIC-2023-003' },
        update: {},
        create: {
            policyNumber: 'LIC-2023-003',
            type: 'LIFE',
            company: 'LIC',
            planName: 'Jeevan Anand',
            sumInsured: 5000000,
            premium: 45000,
            paymentMode: 'ANNUAL',
            startDate: '2023-06-01',
            endDate: '2043-06-01',
            status: 'ACTIVE',
            nominee: 'Neha Patel',
            nomineeRelation: 'Spouse',
            customerId: customer2.id,
            agentId: agent.id,
        },
    })

    await prisma.policy.upsert({
        where: { policyNumber: 'NI-2023-004' },
        update: {},
        create: {
            policyNumber: 'NI-2023-004',
            type: 'HEALTH',
            company: 'Niva Bupa',
            planName: 'ReAssure 2.0',
            subType: 'Individual',
            sumInsured: 500000,
            premium: 9800,
            paymentMode: 'ANNUAL',
            startDate: '2023-08-01',
            endDate: lastYear.toISOString().split('T')[0],
            status: 'EXPIRED',
            customerId: customer3.id,
            agentId: admin.id,
        },
    })

    console.log('✅ Sample policies created')

    // Add family member
    await prisma.familyMember.upsert({
        where: { id: 'demo-family-1' },
        update: {},
        create: {
            id: 'demo-family-1',
            customerId: customer1.id,
            name: 'Neha Patel',
            relation: 'Spouse',
            dob: '1988-09-10',
            gender: 'Female',
            insured: true,
        },
    })

    // Add sample notes
    await prisma.note.create({
        data: {
            customerId: customer1.id,
            agentId: agent.id,
            content: 'Customer is interested in upgrading his health policy to a higher sum insured. Follow up next week.',
            type: 'FOLLOWUP',
        },
    }).catch(() => { }) // ignore duplicates

    await prisma.note.create({
        data: {
            customerId: customer2.id,
            agentId: agent.id,
            content: 'Priya requested information about term insurance plans. Sent brochures via WhatsApp.',
            type: 'GENERAL',
        },
    }).catch(() => { })

    // Add sample call logs
    await prisma.callLog.create({
        data: {
            customerId: customer1.id,
            agentId: agent.id,
            type: 'OUTGOING',
            duration: 180,
            notes: 'Discussed renewal of motor insurance. Customer agreed to renew.',
            outcome: 'RENEWAL',
        },
    }).catch(() => { })

    await prisma.callLog.create({
        data: {
            customerId: customer2.id,
            agentId: agent.id,
            type: 'INCOMING',
            duration: 240,
            notes: 'Customer called about claim process for health insurance.',
            outcome: 'INTERESTED',
        },
    }).catch(() => { })

    console.log('✅ Sample notes and call logs created')
    console.log('\n🎉 Database seeded successfully!')
    console.log('\n📋 Login Credentials:')
    console.log('   Admin:   admin@uvinsurance.in   / admin123')
    console.log('   Agent:   agent@uvinsurance.in   / agent123')
    console.log('   Auditor: auditor@uvinsurance.in / auditor123')
}

main()
    .catch(e => { console.error('Seed error:', e); process.exit(1) })
    .finally(() => prisma.$disconnect())
