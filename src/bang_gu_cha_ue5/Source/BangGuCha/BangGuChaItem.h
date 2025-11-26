#pragma once

#include "BangGuChaItem.generated.h"
#include "CoreMinimal.h"
#include "GameFramework/Actor.h"

class USphereComponent;
class UStaticMeshComponent;

UCLASS()
class BANGGUCHA_API ABangGuChaItem : public AActor {
  GENERATED_BODY()

public:
  ABangGuChaItem();

protected:
  virtual void BeginPlay() override;

public:
  virtual void NotifyActorBeginOverlap(AActor *OtherActor) override;

  UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Components")
  USphereComponent *CollisionComp;

  UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Components")
  UStaticMeshComponent *MeshComp;
};
