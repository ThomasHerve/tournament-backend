import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/typeorm';
import { CreateUserDto, DeleteUserDto } from 'src/users/dto/users.dtos';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  getUsers() {
    return this.userRepository.find();
  }

  createUser(createUserDto: CreateUserDto) {
    const newUser = this.userRepository.create(createUserDto);
    return this.userRepository.save(newUser);
  }

  DeleteUserDto(id: number) {
    if(!this.findUsersById(id)){
        throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
    return this.userRepository.delete(id);
      
  }
      
  findUsersById(id: number): Promise<User> {
    return this.userRepository.findOneBy({id});
  }
}