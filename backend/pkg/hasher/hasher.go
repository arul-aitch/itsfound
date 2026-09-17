package hasher

import "golang.org/x/crypto/bcrypt"

const bcryptCost = 12

func Hash(plain string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(plain), bcryptCost)
	if err != nil {
		return "", err
	}

	return string(hash), nil
}

func Verify(hash string, plain string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(plain)) == nil
}