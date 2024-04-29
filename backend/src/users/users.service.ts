import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@nestjs/typeorm';
import { User } from './users.entity';
import { Repository, EntityManager } from 'typeorm';
import { Role } from './user-roles.enum';
import { generateUuid } from 'src/utils/hash.utils';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User) private userRepo: Repository<User>,
        @InjectEntityManager() private entityManager: EntityManager
    ) {}

    async create(id: string, role: Role) {
        const user = await this.userRepo.create({ id, role });

        return this.userRepo.save(user);
    }

    async findOne(id: string) {
        const user = await this.userRepo.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return user;
    }

    async update(id: string, attrs: Partial<User>) {
        const user = await this.findOne(id);
        if (!user) {
            throw new NotFoundException('users not found');
        }

        Object.assign(user, attrs);
        return this.userRepo.save(user);
    }

    async remove(id: string) {
        const user = await this.findOne(id);
        if (!user) throw new NotFoundException('users not found');
        return this.userRepo.remove(user);
    }

    async isMemberOrCreate(userId: string, role: Role | undefined = Role.User): Promise<boolean> {
        let isMember = true;
        await this.entityManager.transaction(async (transactionalEntityManager) => {
            const foundUser = await transactionalEntityManager.findOne(User, { where: { id: userId } });
            if (!foundUser) {
                let uuid: string = generateUuid();

                let duplicatedUser = await transactionalEntityManager.findOne(User, { where: { nickname: uuid } });
                while (duplicatedUser) {
                    duplicatedUser = await transactionalEntityManager.findOne(User, { where: { nickname: uuid } });
                    uuid = generateUuid();
                }

                const newUser = transactionalEntityManager.create(User, { id: userId, role, nickname: uuid });
                await transactionalEntityManager.save(newUser);
                isMember = false;
            }
        });
        return isMember;
    }
}
