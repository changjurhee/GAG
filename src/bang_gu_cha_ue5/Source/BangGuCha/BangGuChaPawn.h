#pragma once

#include "BangGuChaPawn.generated.h"
#include "CoreMinimal.h"
#include "GameFramework/Pawn.h"

class UBoxComponent;
class UCameraComponent;
class USpringArmComponent;

UCLASS()
class BANGGUCHA_API ABangGuChaPawn : public APawn {
  GENERATED_BODY()

public:
  ABangGuChaPawn();

protected:
  virtual void BeginPlay() override;

public:
  virtual void Tick(float DeltaTime) override;
  virtual void SetupPlayerInputComponent(
      class UInputComponent *PlayerInputComponent) override;

  // Components
  UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Components")
  UBoxComponent *CollisionComp;

  UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Components")
  UStaticMeshComponent *MeshComp;

  UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Components")
  USpringArmComponent *SpringArmComp;

  UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Components")
  UCameraComponent *CameraComp;

  // Movement
  UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Movement")
  float MoveSpeed;

  UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Movement")
  float GridSize;

  // Fuel
  UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Fuel")
  float MaxFuel;

  UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Fuel")
  float CurrentFuel;

  UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Fuel")
  float FuelConsumptionRate;

  // Ability
  UPROPERTY(EditDefaultsOnly, Category = "Ability")
  TSubclassOf<class AActor> SmokeClass;

  UFUNCTION(BlueprintCallable, Category = "Ability")
  void UseFart();

private:
  FVector TargetLocation;
  FVector CurrentDirection;
  FVector NextDirection;

  void MoveUp();
  void MoveDown();
  void MoveLeft();
  void MoveRight();

  void UpdateMovement(float DeltaTime);
  bool CanMoveTo(FVector NewLocation);
};
