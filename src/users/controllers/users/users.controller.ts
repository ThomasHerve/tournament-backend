import {
    Body,
    Controller,
    Post,
    UsePipes,
    ValidationPipe,
    Request,
    UseGuards,
    Get
    } from '@nestjs/common';
import { CreateUserDto } from 'src/users/dto/users.dtos';
import { UsersService } from 'src/users/services/users/users.service';
import { LocalAuthGuard } from 'src/users/services/users/local-auth.guard';
import { Public } from 'src/users/services/users/public.decorator';

@Controller('users')
export class UsersController {
    constructor(private readonly userService: UsersService) {}
    
    @Get('all')
    getUsers() {
      return this.userService.getUsers()
    }

    /*
    @Get('id/:id')
    findUsersById(@Param('id', ParseIntPipe) id: number) {
      return this.userService.findUsersById(id);
    }*/
    
    @Post('create')
    @UsePipes(ValidationPipe)
    async createUser(@Body() createUserDto: CreateUserDto) {
      try {
        await this.userService.createUser(createUserDto);
        return {}
      } catch(e) {
        throw e;
      }
    }

    @Public()
    @UseGuards(LocalAuthGuard)
    @Post('login')
    async login(@Request() req) {
      return this.userService.login(req.user);
    }

    @Get('profile')
    getProfile(@Request() req) {
      return req.user.username;
    }
}
